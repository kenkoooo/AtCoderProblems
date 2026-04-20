pub(crate) mod app_state;
pub(crate) mod auth;
pub(crate) mod error;
pub(crate) mod handlers;

use axum::{
    Router,
    http::header,
    routing::{get, post},
};
use tower_http::cors::{Any, CorsLayer};

pub use app_state::AppState;
pub(crate) use auth::AuthedUser;
pub use auth::{AuthError, GithubAuthenticator, GithubClient, GithubToken};
pub(crate) use error::{ServerError, ServerResult};

pub fn make_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_origin(Any)
        .allow_headers([header::CONTENT_TYPE]);

    let atcoder_api = Router::new()
        .nest("/v2", v2_router())
        .nest("/v3", v3_router())
        .layer(cors);

    Router::new()
        .route("/healthcheck", get(handlers::healthcheck::get_healthcheck))
        .nest("/atcoder-api", atcoder_api)
        .nest("/internal-api", internal_router())
        .with_state(state)
}

fn v2_router() -> Router<AppState> {
    Router::new().route("/user_info", get(handlers::user_info::get_user_info))
}

fn v3_router() -> Router<AppState> {
    use handlers::*;
    Router::new()
        .route("/user_info", get(user_info::get_user_info))
        .route(
            "/rated_point_sum_ranking",
            get(ranking::get_rated_point_sum_ranking),
        )
        .route("/ac_ranking", get(ranking::get_ac_ranking))
        .route("/streak_ranking", get(ranking::get_streak_ranking))
        .route("/language_ranking", get(ranking::get_language_ranking))
        .route("/from/{from}", get(submissions::get_time_submissions))
        .route("/recent", get(submissions::get_recent_submissions))
        .route(
            "/users_and_time",
            get(submissions::get_users_time_submissions),
        )
        .route("/language_list", get(language_count::get_language_list))
        .route(
            "/user/submissions",
            get(submissions::get_user_submissions_from_time),
        )
        .route(
            "/user/submission_count",
            get(submissions::get_user_submission_count),
        )
        .route("/user/ac_rank", get(ranking::get_user_ac_rank))
        .route("/user/streak_rank", get(ranking::get_user_streak_rank))
        .route("/user/language_rank", get(ranking::get_user_language_rank))
        .route(
            "/user/rated_point_sum_rank",
            get(ranking::get_user_rated_point_sum_rank),
        )
}

fn internal_router() -> Router<AppState> {
    use handlers::*;
    Router::new()
        .route("/authorize", get(authorize::get_authorize))
        .route("/user/get", get(internal_user::get_user))
        .route("/user/update", post(internal_user::update_user))
        .route("/list/get/{list_id}", get(problem_list::get_single_list))
        .route("/list/my", get(problem_list::get_my_list))
        .route("/list/create", post(problem_list::create_list))
        .route("/list/update", post(problem_list::update_list))
        .route("/list/delete", post(problem_list::delete_list))
        .route("/list/item/add", post(problem_list::add_item))
        .route("/list/item/update", post(problem_list::update_item))
        .route("/list/item/delete", post(problem_list::delete_item))
        .route("/contest/create", post(virtual_contest::create_contest))
        .route("/contest/update", post(virtual_contest::update_contest))
        .route("/contest/item/update", post(virtual_contest::update_items))
        .route(
            "/contest/get/{contest_id}",
            get(virtual_contest::get_single_contest),
        )
        .route("/contest/join", post(virtual_contest::join_contest))
        .route("/contest/leave", post(virtual_contest::leave_contest))
        .route("/contest/my", get(virtual_contest::get_my_contests))
        .route("/contest/joined", get(virtual_contest::get_participated))
        .route("/contest/recent", get(virtual_contest::get_recent_contests))
        .route(
            "/progress_reset/list",
            get(progress_reset::get_progress_reset_list),
        )
        .route(
            "/progress_reset/add",
            post(progress_reset::add_progress_reset_item),
        )
        .route(
            "/progress_reset/delete",
            post(progress_reset::delete_progress_reset_item),
        )
}
