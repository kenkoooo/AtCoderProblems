pub(crate) mod auth;
pub(crate) mod internal_user;
pub(crate) mod language_count;
pub(crate) mod middleware;
pub(crate) mod problem_list;
pub(crate) mod progress_reset;
pub(crate) mod ranking;
pub(crate) mod rated_point_sum_ranking;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;
pub(crate) mod utils;
pub(crate) mod virtual_contest;

pub use auth::{Authentication, GitHubAuthentication, GitHubUserResponse};

use crate::server::ranking::{
    get_ac_ranking, get_streak_ranking, get_users_ac_rank, get_users_streak_rank,
};
use auth::get_token;
use language_count::get_language_list;
use middleware::LogMiddleware;
use problem_list::{
    add_item, create_list, delete_item, delete_list, get_own_lists, get_single_list, update_item,
    update_list,
};
use rated_point_sum_ranking::get_rated_point_sum_ranking;
use time_submissions::get_time_submissions;
use user_info::get_user_info;
use user_submissions::{
    get_recent_submissions, get_user_submissions, get_user_submissions_from_time,
    get_users_time_submissions,
};

pub async fn run_server<A>(
    pg_pool: sql_client::PgPool,
    authentication: A,
    port: u16,
) -> tide::Result<()>
where
    A: Authentication + Send + Sync + 'static + Clone,
{
    let app_data = AppData::new(pg_pool, authentication);
    let mut api = tide::with_state(app_data.clone());
    api.with(LogMiddleware);
    api.at("/internal-api").nest({
        let mut api = tide::with_state(app_data.clone());
        api.at("/authorize").get(get_token);
        api.at("/list").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/my").get(get_own_lists);
            api.at("/get/:list_id").get(get_single_list);
            api.at("/create").post(create_list);
            api.at("/delete").post(delete_list);
            api.at("/update").post(update_list);
            api.at("/item").nest({
                let mut api = tide::with_state(app_data.clone());
                api.at("/add").post(add_item);
                api.at("/update").post(update_item);
                api.at("/delete").post(delete_item);
                api
            });
            api
        });

        api.at("/contest").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/create").post(virtual_contest::create_contest);
            api.at("/update").post(virtual_contest::update_contest);
            api.at("/item/update").post(virtual_contest::update_items);
            api.at("/get/:contest_id")
                .get(virtual_contest::get_single_contest);
            api.at("/join").post(virtual_contest::join_contest);
            api.at("/leave").post(virtual_contest::leave_contest);
            api.at("/my").get(virtual_contest::get_my_contests);
            api.at("/joined").get(virtual_contest::get_participated);
            api.at("/recent").get(virtual_contest::get_recent_contests);
            api
        });

        api.at("/user").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/get").get(internal_user::get);
            api.at("/update").post(internal_user::update);
            api
        });

        api.at("/progress_reset").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/list").get(progress_reset::get_progress_reset_list);
            api.at("/add").post(progress_reset::add_progress_reset_item);
            api.at("/delete")
                .post(progress_reset::delete_progress_reset_item);
            api
        });
        api
    });
    api.at("/atcoder-api").nest({
        let mut api = tide::with_state(app_data.clone());
        api.at("/results").get(get_user_submissions);
        api.at("/v2").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/user_info").get(get_user_info);
            api
        });
        api.at("/v3").nest({
            let mut api = tide::with_state(app_data.clone());
            api.at("/rated_point_sum_ranking")
                .get(get_rated_point_sum_ranking);
            api.at("/ac_ranking").get(ranking::ranking(get_ac_ranking));
            api.at("/streak_ranking")
                .get(ranking::ranking(get_streak_ranking));
            api.at("/from/:from").get(get_time_submissions);
            api.at("/recent").get(get_recent_submissions);
            api.at("/users_and_time").get(get_users_time_submissions);

            api.at("/user").nest({
                let mut api = tide::with_state(app_data.clone());
                api.at("/submissions").get(get_user_submissions_from_time);
                api.at("/ac_rank")
                    .get(ranking::user_rank(get_users_ac_rank));
                api.at("/streak_rank")
                    .get(ranking::user_rank(get_users_streak_rank));
                api
            });
            api.at("/language_count").nest({
                let mut api = tide::with_state(app_data.clone());
                api.at("/list").get(get_language_list);
                api
            });
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
        Self::new(tide::StatusCode::Ok)
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
    pub(crate) pg_pool: sql_client::PgPool,
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
    fn new(pg_pool: sql_client::PgPool, authentication: A) -> Self {
        Self {
            authentication,
            pg_pool,
        }
    }
}
