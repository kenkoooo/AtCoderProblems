use actix_web::{web, HttpResponse};

use crate::server::{
    internal_user,
    progress_reset::{
        get_progress_reset_list,
        add_progress_reset_item,
        delete_progress_reset_item,
    },
    user_submissions::get_user_submission_count,
    auth::{Authentication, get_token},
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
        RankingSelector, UserRankSelector, StreakRanking, AcRanking, RatedPointSumRanking,
        get_language_ranking, get_users_language_rank,
    },
    virtual_contest::{
        create_contest, update_contest, update_items, get_single_contest,
        join_contest, leave_contest, get_my_contests, get_participated,
        get_recent_contests
    }
};

pub(crate) fn config_services<A: Authentication + Clone + Send + Sync + 'static>(cfg: &mut web::ServiceConfig) {
    log::info!("Configuring routes...");
    cfg.service(
        web::scope("/internal-api")
            .service(web::resource("/authorize").route(web::get().to(get_token::<A>)))
            .service(
                web::scope("/list")
                    .service(web::resource("/my").route(web::get().to(get_own_lists::<A>)))
                    .service(web::resource("/get/{list_id}").route(web::get().to(get_single_list::<A>)))
                    .service(web::resource("/create").route(web::post().to(create_list::<A>)))
                    .service(web::resource("/delete").route(web::post().to(delete_list::<A>)))
                    .service(web::resource("/update").route(web::post().to(update_list::<A>)))
                    .service(
                        web::scope("/item")
                            .service(web::resource("/add").route(web::post().to(add_item::<A>)))
                            .service(web::resource("/update").route(web::post().to(update_item::<A>)))
                            .service(web::resource("/delete").route(web::post().to(delete_item::<A>)))
                    )
            )
            .service(
                web::scope("/contest")
                    .service(web::resource("/create").route(web::post().to(create_contest::<A>)))
                    .service(web::resource("/update").route(web::post().to(update_contest::<A>)))
                    .service(web::resource("/item/update").route(web::post().to(update_items::<A>)))
                    .service(web::resource("/get/{contest_id}").route(web::get().to(get_single_contest::<A>)))
                    .service(web::resource("/join").route(web::post().to(join_contest::<A>)))
                    .service(web::resource("/leave").route(web::post().to(leave_contest::<A>)))
                    .service(web::resource("/my").route(web::get().to(get_my_contests::<A>)))
                    .service(web::resource("/joined").route(web::get().to(get_participated::<A>)))
                    .service(web::resource("/recent").route(web::get().to(get_recent_contests::<A>)))
            )
            .service(
                web::scope("/user")
                    .service(web::resource("/get").route(web::get().to(internal_user::get::<A>)))
                    .service(web::resource("/update").route(web::post().to(internal_user::update::<A>)))
            )
            .service(
                web::scope("/progress_reset")
                    .service(web::resource("/list").route(web::get().to(get_progress_reset_list::<A>)))
                    .service(web::resource("/add").route(web::post().to(add_progress_reset_item::<A>)))
                    .service(web::resource("/delete").route(web::post().to(delete_progress_reset_item::<A>)))
            )
    ).service(
        web::scope("/atcoder-api")
            .service(web::resource("/results").route(web::get().to(get_user_submissions::<A>)))
            .service(
                web::scope("/v2")
                    .service(web::resource("/user_info").route(web::get().to(get_user_info::<A>)))
            )
            .service(
                web::scope("/v3")
                    .service(web::resource("/user_info").route(web::get().to(get_user_info::<A>)))
                    .service(web::resource("/rated_point_sum_ranking").route(web::get().to(get_rated_point_sum_ranking::<A>)))
                    .service(web::resource("/ac_ranking").route(web::get().to(<AcRanking as RankingSelector<A>>::get_ranking)))
                    .service(web::resource("/streak_ranking").route(web::get().to(<StreakRanking as RankingSelector<A>>::get_ranking)))
                    .service(web::resource("/language_ranking").route(web::get().to(get_language_ranking::<A>)))
                    .service(web::resource("/from/{from}").route(web::get().to(get_time_submissions::<A>)))
                    .service(web::resource("/recent").route(web::get().to(get_recent_submissions::<A>)))
                    .service(web::resource("/users_and_time").route(web::get().to(get_users_time_submissions::<A>)))
                    .service(
                        web::scope("/user")
                            .service(web::resource("/submissions").route(web::get().to(get_user_submissions_from_time::<A>)))
                            .service(web::resource("/submission_count").route(web::get().to(get_user_submission_count::<A>)))
                            .service(web::resource("/ac_rank").route(web::get().to(<AcRanking as UserRankSelector<A>>::get_users_rank)))
                            .service(web::resource("/streak_rank").route(web::get().to(<StreakRanking as UserRankSelector<A>>::get_users_rank)))
                            .service(web::resource("/language_rank").route(web::get().to(get_users_language_rank::<A>)))
                            .service(web::resource("rated_point_sum_rank").route(web::get().to(<RatedPointSumRanking as UserRankSelector<A>>::get_users_rank)))
                    )
                    .service(web::resource("language_list").route(web::get().to(get_language_list::<A>)))
            )
    )
    .service(web::resource("/healthcheck").route(web::get().to(|| HttpResponse::Ok().finish())));
}