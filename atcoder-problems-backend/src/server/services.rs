use actix_web::web;

use crate::server::{
    endpoint,
    language_count::get_language_list,
    ranking::{
        AcRanking, LanguageRanking, RankingSelector, RatedPointSumRanking, StreakRanking,
        UserRankSelector,
    },
    time_submissions::get_time_submissions,
    user_info::get_user_info,
    user_submissions::get_user_submission_count,
    user_submissions::{
        get_recent_submissions, get_user_submissions_from_time, get_users_time_submissions,
    },
};

pub fn config_services(cfg: &mut web::ServiceConfig) {
    log::info!("Configuring routes...");
    cfg.service(endpoint::internal_api::get_authorize)
        .service(endpoint::internal_api::list::get_list)
        .service(endpoint::internal_api::list::get_my_list)
        .service(endpoint::internal_api::list::create_list)
        .service(endpoint::internal_api::list::delete_list)
        .service(endpoint::internal_api::list::update_list)
        .service(endpoint::internal_api::list::item::add_item)
        .service(endpoint::internal_api::list::item::update_item)
        .service(endpoint::internal_api::list::item::delete_item)
        .service(endpoint::internal_api::contest::create_contest)
        .service(endpoint::internal_api::contest::update_contest)
        .service(endpoint::internal_api::contest::item::update_items)
        .service(endpoint::internal_api::contest::get_single_contest)
        .service(endpoint::internal_api::contest::join_contest)
        .service(endpoint::internal_api::contest::leave_contest)
        .service(endpoint::internal_api::contest::get_my_contests)
        .service(endpoint::internal_api::contest::get_participated)
        .service(endpoint::internal_api::contest::get_recent_contests)
        .service(endpoint::internal_api::user::get)
        .service(endpoint::internal_api::user::update)
        .service(endpoint::internal_api::progress_reset::get_progress_reset_list)
        .service(endpoint::internal_api::progress_reset::add_progress_reset_item)
        .service(endpoint::internal_api::progress_reset::delete_progress_reset_item)
        .service(
            web::scope("/atcoder-api")
                .service(
                    web::scope("/v2")
                        .service(web::resource("/user_info").route(web::get().to(get_user_info))),
                )
                .service(
                    web::scope("/v3")
                        .service(web::resource("/user_info").route(web::get().to(get_user_info)))
                        .service(web::resource("/rated_point_sum_ranking").route(
                            web::get().to(<RatedPointSumRanking as RankingSelector>::get_ranking),
                        ))
                        .service(
                            web::resource("/ac_ranking")
                                .route(web::get().to(<AcRanking as RankingSelector>::get_ranking)),
                        )
                        .service(
                            web::resource("/streak_ranking").route(
                                web::get().to(<StreakRanking as RankingSelector>::get_ranking),
                            ),
                        )
                        .service(web::resource("/language_ranking").route(
                            web::get().to(<LanguageRanking as RankingSelector>::get_ranking),
                        ))
                        .service(
                            web::resource("/from/{from}")
                                .route(web::get().to(get_time_submissions)),
                        )
                        .service(
                            web::resource("/recent").route(web::get().to(get_recent_submissions)),
                        )
                        .service(
                            web::resource("/users_and_time")
                                .route(web::get().to(get_users_time_submissions)),
                        )
                        .service(
                            web::scope("/user")
                                .service(
                                    web::resource("/submissions")
                                        .route(web::get().to(get_user_submissions_from_time)),
                                )
                                .service(
                                    web::resource("/submission_count")
                                        .route(web::get().to(get_user_submission_count)),
                                )
                                .service(web::resource("/ac_rank").route(
                                    web::get().to(<AcRanking as UserRankSelector>::get_users_rank),
                                ))
                                .service(
                                    web::resource("/streak_rank").route(
                                        web::get().to(
                                            <StreakRanking as UserRankSelector>::get_users_rank,
                                        ),
                                    ),
                                )
                                .service(
                                    web::resource("/language_rank").route(
                                        web::get().to(
                                            <LanguageRanking as UserRankSelector>::get_users_rank,
                                        ),
                                    ),
                                )
                                .service(web::resource("rated_point_sum_rank").route(
                                    web::get().to(
                                        <RatedPointSumRanking as UserRankSelector>::get_users_rank,
                                    ),
                                )),
                        )
                        .service(
                            web::resource("language_list").route(web::get().to(get_language_list)),
                        ),
                ),
        )
        .service(endpoint::healthcheck::get_healthcheck);
}
