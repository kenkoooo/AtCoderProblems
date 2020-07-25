use sql_client::internal::progress_reset_manager::{
    ProgressResetItem, ProgressResetList, ProgressResetManager,
};

mod utils;

#[async_std::test]
async fn test_progress_reset_manager() {
    let internal_user_id = "user_id";
    let atcoder_user_id = "atcoder_id";
    let problem_id = "problem_id";
    let reset_epoch_second = 42;
    let pool = utils::initialize_and_connect_to_test_sql().await;
    utils::setup_internal_user(&pool, internal_user_id, atcoder_user_id).await;

    // get_progress_reset_list (empty)
    let list = pool
        .get_progress_reset_list(internal_user_id)
        .await
        .unwrap();
    assert!(list.items.is_empty());

    // add_item
    pool.add_item(internal_user_id, problem_id, reset_epoch_second)
        .await
        .unwrap();
    let list = pool
        .get_progress_reset_list(internal_user_id)
        .await
        .unwrap();
    assert_eq!(
        list,
        ProgressResetList {
            items: vec![ProgressResetItem {
                problem_id: problem_id.to_string(),
                reset_epoch_second,
            }],
        }
    );

    // Checks that calling `add_item` on the same `internal_user_id` and `problem_id`
    // causes updating `reset_epoch_second`
    let updated_reset_epoch_second = 334;
    pool.add_item(internal_user_id, problem_id, updated_reset_epoch_second)
        .await
        .unwrap();
    let list = pool
        .get_progress_reset_list(internal_user_id)
        .await
        .unwrap();
    assert_eq!(
        list,
        ProgressResetList {
            items: vec![ProgressResetItem {
                problem_id: problem_id.to_string(),
                reset_epoch_second: updated_reset_epoch_second,
            }],
        }
    );

    // remove_item
    pool.remove_item(internal_user_id, problem_id)
        .await
        .unwrap();
    let list = pool
        .get_progress_reset_list(internal_user_id)
        .await
        .unwrap();
    assert!(list.items.is_empty());
}
