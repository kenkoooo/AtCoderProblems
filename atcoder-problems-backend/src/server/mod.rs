use crate::server::accepted_count_ranking::get_ac_ranking;
use crate::server::time_submissions::get_time_submissions;
use crate::server::user_info::get_user_info;
use crate::server::user_submissions::{
    get_recent_submissions, get_user_submissions, get_users_time_submissions,
};
pub(crate) mod auth;
use crate::server::middleware::LogMiddleware;
use crate::server::problem_list::{
    add_item, create_list, delete_item, delete_list, get_own_lists, get_single_list, update_item,
    update_list,
};
use auth::get_token;
pub use auth::{Authentication, GitHubAuthentication, GitHubUserResponse};
use sql_client::PgPool;
use tide::{Result, StatusCode};

pub(crate) mod accepted_count_ranking;
pub(crate) mod internal_user;
pub(crate) mod middleware;
pub(crate) mod problem_list;
pub(crate) mod progress_reset;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;
pub(crate) mod utils;
pub(crate) mod virtual_contest;

pub async fn run_server<A>(pg_pool: PgPool, authentication: A, port: u16) -> Result<()>
where
    A: Authentication + Send + Sync + 'static + Clone,
{
    let app_data = AppData::new(pg_pool, authentication);
    let mut api = tide::with_state(app_data.clone());
    api.with(LogMiddleware);
    api.at("/internal-api").nest({
        let mut api = tide::with_state(app_data.clone());
        api.at("/authorize").get_ah(get_token);
        api.at("/list").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/my").get_ah(get_own_lists);
            api.at("/get/:list_id").get_ah(get_single_list);
            api.at("/create").post_ah(create_list);
            api.at("/delete").post_ah(delete_list);
            api.at("/update").post_ah(update_list);
            api.at("/item").nest({
                let mut api = tide::with_state(app_data.clone());
                api.at("/add").post_ah(add_item);
                api.at("/update").post_ah(update_item);
                api.at("/delete").post_ah(delete_item);
                api
            });
            api
        });

        api.at("/contest").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/create").post_ah(virtual_contest::create_contest);
            api.at("/update").post_ah(virtual_contest::update_contest);
            api.at("/item/update")
                .post_ah(virtual_contest::update_items);
            api.at("/get/:contest_id")
                .get_ah(virtual_contest::get_single_contest);
            api.at("/join").post_ah(virtual_contest::join_contest);
            api.at("/leave").post_ah(virtual_contest::leave_contest);
            api.at("/my").get_ah(virtual_contest::get_my_contests);
            api.at("/joined").get_ah(virtual_contest::get_participated);
            api.at("/recent")
                .get_ah(virtual_contest::get_recent_contests);
            api
        });

        api.at("/user").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/get").get_ah(internal_user::get);
            api.at("/update").post_ah(internal_user::update);
            api
        });

        api.at("/progress_reset").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/list")
                .get_ah(progress_reset::get_progress_reset_list);
            api.at("/add")
                .post_ah(progress_reset::add_progress_reset_item);
            api.at("/delete")
                .post_ah(progress_reset::delete_progress_reset_item);
            api
        });
        api
    });
    api.at("/atcoder-api").nest({
        let mut api = tide::with_state(app_data.clone());
        api.at("/results").get_ah(get_user_submissions);
        api.at("/v2").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/user_info").get_ah(get_user_info);
            api
        });
        api.at("/v3").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/ac_ranking").get_ah(get_ac_ranking);
            api.at("/from/:from").get_ah(get_time_submissions);
            api.at("/recent").get_ah(get_recent_submissions);
            api.at("/users_and_time").get_ah(get_users_time_submissions);
            api
        });
        api
    });
    api.at("/healthcheck").get(|_| async move { Ok("") });
    api.listen(format!("0.0.0.0:{}", port)).await?;
    Ok(())
}

pub(crate) trait CommonResponse {
    fn ok() -> Self;
    fn json<S: serde::Serialize>(body: &S) -> tide::Result<Self>
    where
        Self: Sized;
    fn empty_json() -> Self;
    fn make_cors(self) -> Self;
}

impl CommonResponse for tide::Response {
    fn ok() -> Self {
        Self::new(StatusCode::Ok)
    }
    fn json<S: serde::Serialize>(body: &S) -> tide::Result<Self>
    where
        Self: Sized,
    {
        let response = Self::builder(tide::StatusCode::Ok)
            .content_type(tide::http::mime::JSON)
            .body(tide::Body::from_json(body)?)
            .build();
        Ok(response)
    }
    fn empty_json() -> Self {
        Self::builder(tide::StatusCode::Ok)
            .content_type(tide::http::mime::JSON)
            .body("{}")
            .build()
    }
    fn make_cors(self) -> Self {
        let mut response = self;
        response.insert_header(tide::http::headers::ACCESS_CONTROL_ALLOW_ORIGIN, "*");
        response
    }
}

pub(crate) struct AppData<A> {
    pub(crate) authentication: A,
    pub(crate) pg_pool: PgPool,
}

impl<A: Clone> Clone for AppData<A> {
    fn clone(&self) -> Self {
        Self {
            pg_pool: self.pg_pool.clone(),
            authentication: self.authentication.clone(),
        }
    }
}

impl<A> AppData<A> {
    fn new(pg_pool: PgPool, authentication: A) -> Self {
        Self {
            pg_pool,
            authentication,
        }
    }
}

/// This trait extends [Route] to handle a function which returns tide::Result<Response>
trait RouteExt<F> {
    fn get_ah(&mut self, endpoint: F) -> &mut Self;
    fn post_ah(&mut self, endpoint: F) -> &mut Self;
}

impl<'a, State, Fut, F> RouteExt<F> for tide::Route<'a, State>
where
    State: Send + Sync + 'static + Clone,
    F: Fn(tide::Request<State>) -> Fut + Sync + Send + 'static,
    Fut: std::future::Future<Output = tide::Result<tide::Response>> + Send + 'static,
{
    fn get_ah(&mut self, endpoint: F) -> &mut Self {
        self.get(move |request| {
            let fut = endpoint(request);
            Box::pin(async move {
                let response = fut.await?;
                Ok(response)
            })
        })
    }
    fn post_ah(&mut self, endpoint: F) -> &mut Self {
        self.post(move |request| {
            let fut = endpoint(request);
            Box::pin(async move {
                let response = fut.await?;
                Ok(response)
            })
        })
    }
}
