use sql_client::internal::user_manager::{InternalUserInfo, UserManager};

mod utils;

#[async_std::test]
async fn test_user_manager() {
    let internal_user_id = "user_id";
    let atcoder_user_id = "atcoder_id";
    let pool = utils::initialize_and_connect_to_test_sql().await;

    // try to get a user who has not yet been registered
    let get_result = pool.get_internal_user_info(internal_user_id).await;
    assert!(get_result.is_err());

    // register_user
    let register_result = pool.register_user(internal_user_id).await;
    assert!(register_result.is_ok());

    // calling `register_user` twice has no effect
    let register_result = pool.register_user(internal_user_id).await;
    assert!(register_result.is_ok());

    // get_internal_user_info (a user whose atcoder_user_id has not been set)
    let get_result = pool.get_internal_user_info(internal_user_id).await.unwrap();
    assert_eq!(
        get_result,
        InternalUserInfo {
            internal_user_id: internal_user_id.to_string(),
            atcoder_user_id: None,
        }
    );

    // update_internal_user_info (set atcoder_user_id)
    let update_result = pool
        .update_internal_user_info(internal_user_id, atcoder_user_id)
        .await;
    assert!(update_result.is_ok());

    // get_internal_user_info (atcoder_user_id is set now)
    let get_result = pool.get_internal_user_info(internal_user_id).await.unwrap();
    assert_eq!(
        get_result,
        InternalUserInfo {
            internal_user_id: internal_user_id.to_string(),
            atcoder_user_id: Some(atcoder_user_id.to_string()),
        }
    );
}
