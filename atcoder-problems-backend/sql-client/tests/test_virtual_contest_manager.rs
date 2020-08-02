use sql_client::internal::virtual_contest_manager::{
    VirtualContestInfo, VirtualContestItem, VirtualContestManager, MAX_PROBLEM_NUM_PER_CONTEST,
};
use std::time::{SystemTime, UNIX_EPOCH};

mod utils;

const TIME_DELTA: i64 = 1000;

fn current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

#[async_std::test]
async fn test_virtual_contest_manager() {
    let now = current_timestamp();
    let pool = utils::initialize_and_connect_to_test_sql().await;
    let user_id = "user_id";
    let atcoder_id = "atcoder_id";
    utils::setup_internal_user(&pool, user_id, atcoder_id).await;

    let recent_contests = pool.get_recent_contest_info().await.unwrap();
    assert!(
        recent_contests.is_empty(),
        "`get_recent_contest_info` here should return an empty list, but got not empty."
    );

    let running_problems = pool.get_running_contest_problems(now).await.unwrap();
    assert!(
        running_problems.is_empty(),
        "`get_running_contest_problems` here should return an empty list, but got not empty."
    );

    let owned_contests = pool.get_own_contests(user_id).await.unwrap();
    assert!(
        owned_contests.is_empty(),
        "`get_own_contests` here should return an empty list, but got not empty."
    );

    let participated_contests = pool.get_participated_contests(user_id).await.unwrap();
    assert!(
        participated_contests.is_empty(),
        "`get_participated_contests` here should return an empty list, but got not empty."
    );

    let title = "title";
    let memo = "memo";
    let start_epoch_second = 0;
    let duration_second = now.saturating_add(TIME_DELTA); // future
    let mode = None;
    let is_public = true;
    let penalty_second = 42;
    let contest_id = pool
        .create_contest(
            title,
            memo,
            user_id,
            start_epoch_second,
            duration_second,
            mode.as_deref(),
            is_public,
            penalty_second,
        )
        .await
        .unwrap();
    let created_contest = VirtualContestInfo {
        id: contest_id.clone(),
        title: title.to_string(),
        memo: memo.to_string(),
        owner_user_id: user_id.to_string(),
        start_epoch_second,
        duration_second,
        mode: mode.clone(),
        is_public,
        penalty_second,
    };
    let created_contests = vec![created_contest.clone()];

    let owned_contests = pool.get_own_contests(user_id).await.unwrap();
    assert_eq!(
        &owned_contests, &created_contests,
        "The user should own the contest that has just been created, but not."
    );

    let recent_contests = pool.get_recent_contest_info().await.unwrap();
    assert_eq!(
        &recent_contests, &created_contests,
        "`get_recent_contest_info` should return the contest that has just been created, but not."
    );

    let contest_info = pool.get_single_contest_info(&contest_id).await.unwrap();
    assert_eq!(
        &contest_info,
        &created_contest,
        "There is a difference between the contest that we have just created and the actual saved data."
    );

    let participants = pool
        .get_single_contest_participants(&contest_id)
        .await
        .unwrap();
    assert!(
        participants.is_empty(),
        "There should be no participants now, but actually not."
    );

    let problems = pool.get_single_contest_problems(&contest_id).await.unwrap();
    assert!(
        problems.is_empty(),
        "There should be no problems belonging to the contest, but actually not."
    );

    let added_problems = [
        VirtualContestItem {
            id: "0".to_string(),
            point: Some(100),
            order: Some(1),
        },
        VirtualContestItem {
            id: "1".to_string(),
            point: Some(200),
            order: Some(2),
        },
    ];
    pool.update_items(&contest_id, &added_problems, user_id)
        .await
        .unwrap();

    let problems = pool.get_single_contest_problems(&contest_id).await.unwrap();
    assert_eq!(
        &problems, &added_problems,
        "`update_items` failed to add items to the contest."
    );

    let running_problems = pool.get_running_contest_problems(now).await.unwrap();
    assert_eq!(
        running_problems,
        ["0", "1"],
        "Could not get the IDs of the running problems."
    );

    let too_many_problems = (0..=MAX_PROBLEM_NUM_PER_CONTEST)
        .map(|i| VirtualContestItem {
            id: i.to_string(),
            point: Some(i as i64),
            order: Some(i as i64),
        })
        .collect::<Vec<_>>();
    let update_result = pool
        .update_items(&contest_id, &too_many_problems, user_id)
        .await
        .unwrap_err();
    assert_eq!(
        update_result.to_string(),
        "The number of problems exceeded."
    );

    pool.join_contest(&contest_id, user_id).await.unwrap();

    let participated_contests = pool.get_participated_contests(user_id).await.unwrap();
    assert_eq!(
        &participated_contests, &created_contests,
        "The user should participate in the contest, but not."
    );
    let participants = pool
        .get_single_contest_participants(&contest_id)
        .await
        .unwrap();
    assert_eq!(
        participants,
        [atcoder_id],
        "Could not get the patticipant AtCoder ID."
    );

    pool.leave_contest(&contest_id, user_id).await.unwrap();

    let participated_contests = pool.get_participated_contests(user_id).await.unwrap();
    assert!(
        participated_contests.is_empty(),
        "`get_participated_contests` here should return an empty list, but got not empty."
    );
    let participants = pool
        .get_single_contest_participants(&contest_id)
        .await
        .unwrap();
    assert!(
        participants.is_empty(),
        "There should be no participants now, but actually not."
    );

    let updated_duration_second = now.saturating_sub(TIME_DELTA); // past
    pool.update_contest(
        &contest_id,
        title,
        memo,
        start_epoch_second,
        updated_duration_second,
        mode.as_deref(),
        is_public,
        penalty_second,
    )
    .await
    .unwrap();

    let updated_contest_info = pool.get_single_contest_info(&contest_id).await.unwrap();
    assert_eq!(
        &updated_contest_info,
        &VirtualContestInfo {
            id: contest_id.to_string(),
            title: title.to_string(),
            memo: memo.to_string(),
            owner_user_id: user_id.to_string(),
            start_epoch_second,
            duration_second: updated_duration_second,
            mode: mode.clone(),
            is_public,
            penalty_second,
        },
        "There is a difference between the contest that we have just updated and the actual saved data."
    );

    let running_problems = pool.get_running_contest_problems(now).await.unwrap();
    assert!(
        running_problems.is_empty(),
        "`get_running_contest_problems` here should return an empty list, but got not empty."
    );
}
