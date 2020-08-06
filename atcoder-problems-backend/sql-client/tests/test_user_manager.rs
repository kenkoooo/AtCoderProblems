use sql_client::internal::user_manager::{InternalUserInfo, UserManager};

mod utils;

#[async_std::test]
async fn test_user_manager() {
    let internal_user_id = "user_id";
    let atcoder_user_id = "atcoder_id";
    let pool = utils::initialize_and_connect_to_test_sql().await;

    let get_result = pool.get_internal_user_info(internal_user_id).await;
    assert!(
        get_result.is_err(),
        "`get_result` for a user who has not yet been registered should be `Err`, but got `Ok`."
    );

    let register_result = pool.register_user(internal_user_id).await;
    assert!(
        register_result.is_ok(),
        "`register_user` failed unexpectedly."
    );

    let register_result = pool.register_user(internal_user_id).await;
    assert!(
        register_result.is_ok(),
        "Calling `register_user` twice should return `Ok`, but got `Err`."
    );

    let get_result = pool.get_internal_user_info(internal_user_id).await.unwrap();
    assert_eq!(
        get_result,
        InternalUserInfo {
            internal_user_id: internal_user_id.to_string(),
            atcoder_user_id: None,
        },
        "`get_internal_user_info` for a user whose `atcoder_user_id` is not set returned an unexpected value."
    );

    let update_result = pool
        .update_internal_user_info(internal_user_id, atcoder_user_id)
        .await;
    assert!(
        update_result.is_ok(),
        "`update_internal_user_info` failed unexpectedly."
    );

    let get_result = pool.get_internal_user_info(internal_user_id).await.unwrap();
    assert_eq!(
        get_result,
        InternalUserInfo {
            internal_user_id: internal_user_id.to_string(),
            atcoder_user_id: Some(atcoder_user_id.to_string()),
        },
        "`get_internal_user_info` after `atcoder_user_id` was set returned an unexpected value."
    );
}
