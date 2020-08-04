use crate::error::Result;
use crate::server::time_submissions::get_time_submissions;
use crate::server::user_info::get_user_info;
use crate::server::user_submissions::{
    get_recent_submissions, get_user_submissions, get_users_time_submissions,
};

pub(crate) mod auth;
use crate::server::problem_list::{
    add_item, create_list, delete_item, delete_list, get_own_lists, get_single_list, update_item,
    update_list,
};
use auth::get_token;
pub use auth::{Authentication, GitHubAuthentication, GitHubUserResponse};
use sql_client::PgPool;
use std::time::Duration;
use tide::StatusCode;

pub(crate) mod internal_user;
pub(crate) mod problem_list;
pub(crate) mod progress_reset;
pub(crate) mod time_submissions;
pub(crate) mod user_info;
pub(crate) mod user_submissions;
pub(crate) mod utils;
pub(crate) mod virtual_contest;

pub(crate) type Pool = diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<diesel::PgConnection>>;
pub(crate) type PooledConnection =
    diesel::r2d2::PooledConnection<diesel::r2d2::ConnectionManager<diesel::PgConnection>>;

pub async fn run_server<A>(pool: Pool, pg_pool: PgPool, authentication: A, port: u16) -> Result<()>
where
    A: Authentication + Send + Sync + 'static + Clone,
{
    let app_data = AppData::new(pool, authentication);
    let mut api = tide::with_state(app_data.clone());

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
            api.at("/from/:from").get(get_time_submissions);
            api.at("/recent").get(get_recent_submissions);
            api.at("/users_and_time").get(get_users_time_submissions);
            api
        });
        api
    });
    api.at("/healthcheck").get(|_| async move { Ok("") });
    api.listen(format!("0.0.0.0:{}", port)).await?;
    Ok(())
}

pub fn initialize_pool<S: Into<String>>(database_url: S) -> Result<Pool> {
    let manager = diesel::r2d2::ConnectionManager::<diesel::PgConnection>::new(database_url);
    let pool = diesel::r2d2::Pool::builder()
        .max_lifetime(Some(Duration::from_secs(60 * 5)))
        .max_size(15)
        .build(manager)?;
    Ok(pool)
}

pub(crate) trait CommonResponse {
    fn ok() -> Self;
    fn new_cors() -> Self;
    fn bad_request() -> Self;
    fn internal_error() -> Self;
}

impl CommonResponse for tide::Response {
    fn ok() -> Self {
        Self::new(StatusCode::Ok)
    }
    fn new_cors() -> Self {
        Self::ok().set_header("access-control-allow-origin", "*")
    }
    fn bad_request() -> Self {
        Self::new(StatusCode::BadRequest)
    }
    fn internal_error() -> Self {
        Self::new(StatusCode::InternalServerError)
    }
}

pub(crate) struct AppData<A> {
    pub(crate) pool: Pool,
    pub(crate) authentication: A,
}

impl<A: Clone> Clone for AppData<A> {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
            authentication: self.authentication.clone(),
        }
    }
}

impl<A> AppData<A> {
    fn new(pool: Pool, authentication: A) -> Self {
        Self {
            pool,
            authentication,
        }
    }
}
