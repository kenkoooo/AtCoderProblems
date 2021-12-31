use actix_web::web;

use crate::server::{
    internal_user,
    progress_reset::{
        get_progress_reset_list,
        add_progress_reset_item,
        delete_progress_reset_item,
    },
    user_submissions::get_user_submission_count,
    auth::get_token,
    language_count::get_language_list,
    problem_list::{
        add_item, create_list, delete_item, delete_list, get_own_lists, get_single_list, update_item, update_list,
    },
    rated_point_sum_ranking::get_rated_point_sum_ranking,
    time_submissions::get_time_submissions,
    user_info::get_user_info,
    user_submissions::{
        get_recent_submissions, get_user_submissions, get_user_submissions_from_time,
        get_users_time_submissions,
    },
    ranking::{
        self, get_ac_ranking, get_language_ranking, get_streak_ranking, get_users_ac_rank,
        get_users_language_rank, get_users_rated_point_sum_rank, get_users_streak_rank,
    },
    virtual_contest::{
        create_contest, update_contest, update_items, get_single_contest,
        join_contest, leave_contest, get_my_contests, get_participated,
        get_recent_contests
    }
};

pub(crate) fn config_services(cfg: &mut web::ServiceConfig) {
    log::info!("Configuring routes...");
    cfg.service(
        web::scope("/internal-api")
            .service(web::resource("/authorize").route(web::get().to(get_token)))
            .service(
                web::scope("/list")
                    .service(web::resource("/my").route(web::get().to(get_own_lists)))
                    .service(web::resource("/get/{list_id}").route(web::get().to(get_single_list)))
                    .service(web::resource("/create").route(web::post().to(create_list)))
                    .service(web::resource("/delete").route(web::post().to(delete_list)))
                    .service(web::resource("/update").route(web::post().to(update_list)))
                    .service(
                        web::scope("/item")
                            .service(web::resource("/add").route(web::post().to(add_item)))
                            .service(web::resource("/update").route(web::post().to(update_item)))
                            .service(web::resource("/delete").route(web::post().to(delete_item)))
                    )
            )
            .service(
                web::scope("/contest")
                    .service(web::resource("/create").route(web::post().to(create_contest)))
                    .service(web::resource("/update").route(web::post().to(update_contest)))
                    .service(web::resource("/item/update").route(web::post().to(update_items)))
                    .service(web::resource("/get/{contest_id}").route(web::get().to(get_single_contest)))
                    .service(web::resource("/join").route(web::post().to(join_contest)))
                    .service(web::resource("/leave").route(web::post().to(leave_contest)))
                    .service(web::resource("/my").route(web::get().to(get_my_contests)))
                    .service(web::resource("/joined").route(web::get().to(get_participated)))
                    .service(web::resource("/recent").route(web::get().to(get_recent_contests)))
            )
            .service(
                web::scope("/user")
                    .service(web::resource("/get").route(web::get().to(internal_user::get)))
                    .service(web::resource("/update").route(web::post().to(internal_user::update)))
            )
            .service(
                web::scope("/progress_reset")
                    .service(web::resource("/list").route(web::get().to(get_progress_reset_list)))
                    .service(web::resource("/add").route(web::post().to(add_progress_reset_item)))
                    .service(web::resource("/delete").route(web::post().to(delete_progress_reset_item)))
            )
    ).service(
        web::scope("/atcoder-api")
            .service(web::resource("/results").route(web::get().to(get_user_submissions)))
            .service(
                web::scope("/v2")
                    .service(web::resource("/user_info").route(web::get().to(get_user_info)))
            )
            .service(
                web::scope("/v3")
                    .service(web::resource("/user_info").route(web::get().to(get_user_info)))
                    .service(web::resource("/rated_point_sum_ranking").route(web::get().to(get_rated_point_sum_ranking)))
                    .service(web::resource("/ac_ranking").route(web::get().to(ranking::ranking(get_ac_ranking))))
                    .service(web::resource("/streak_ranking").route(web::get().to(ranking::ranking(get_streak_ranking))))
                    .service(web::resource("/language_ranking").route(web::get().to(get_language_ranking)))
                    .service(web::resource("/from/{from}").route(web::get().to(get_time_submissions)))
                    .service(web::resource("/recent").route(web::get().to(get_recent_submissions)))
                    .service(web::resource("/users_and_time").route(web::get().to(get_users_time_submissions)))
                    .service(
                        web::scope("/user")
                            .service(web::resource("/submissions").route(web::get().to(get_user_submissions_from_time)))
                            .service(web::resource("/submission_count").route(web::get().to(get_user_submission_count)))
                            .service(web::resource("/ac_rank").route(web::get().to(ranking::user_rank(get_users_ac_rank))))
                            .service(web::resource("/streak_rank").route(web::get().to(ranking::user_rank(get_users_streak_rank))))
                            .service(web::resource("/language_rank").route(web::get().to(get_users_language_rank)))
                            .service(web::resource("rated_point_sum_rank").route(web::get().to(ranking::user_rank(get_users_rated_point_sum_rank))))
                    )
                    .service(web::resource("language_list").route(web::get().to(get_language_list)))
            )
    )
    .service(web::resource("/healthcheck").route(web::get().to(|_| async move { Ok("") })));
}