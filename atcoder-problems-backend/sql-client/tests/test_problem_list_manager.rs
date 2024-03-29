use sql_client::internal::problem_list_manager::{ListItem, ProblemList, ProblemListManager};

mod utils;

#[tokio::test]
async fn test_problem_list_manager() {
    let internal_user_id = "user_id";
    let atcoder_user_id = "atcoder_id";
    let list_name = "list_name";
    let problem_id = "problem_id";
    let pool = utils::initialize_and_connect_to_test_sql().await;
    utils::setup_internal_user(&pool, internal_user_id, atcoder_user_id).await;

    assert!(
        pool.get_list(internal_user_id).await.unwrap().is_empty(),
        "`get_list` here should return an empty list, but got not empty."
    );

    let list_id = pool.create_list(internal_user_id, list_name).await.unwrap();

    let list = pool.get_single_list(&list_id).await.unwrap();
    assert_eq!(
        list,
        ProblemList {
            internal_list_id: list_id.clone(),
            internal_list_name: list_name.to_string(),
            internal_user_id: internal_user_id.to_string(),
            items: vec![],
        },
        "`get_single_list` returned an unexpected value."
    );

    pool.update_list(&list_id, "list_name_updated")
        .await
        .unwrap();
    let list = pool.get_single_list(&list_id).await.unwrap();
    assert_eq!(
        list.internal_list_name, "list_name_updated",
        "`internal_list_name` should be updated, but not."
    );

    pool.add_item(&list_id, problem_id).await.unwrap();
    let list = pool.get_single_list(&list_id).await.unwrap();
    assert_eq!(
        list.items,
        vec![ListItem {
            problem_id: problem_id.to_string(),
            memo: "".to_string(),
        }],
        "The item that has been added to the list is not found."
    );

    pool.update_item(&list_id, problem_id, "memo_updated")
        .await
        .unwrap();
    let list = pool.get_single_list(&list_id).await.unwrap();
    assert_eq!(
        list.items,
        vec![ListItem {
            problem_id: problem_id.to_string(),
            memo: "memo_updated".to_string(),
        }],
        "`memo` should be updated, but not."
    );

    pool.delete_item(&list_id, problem_id).await.unwrap();
    let list = pool.get_single_list(&list_id).await.unwrap();
    assert!(
        list.items.is_empty(),
        "The list still has its item unexpectedly."
    );

    pool.delete_list(&list_id).await.unwrap();
    assert!(
        pool.get_list(internal_user_id).await.unwrap().is_empty(),
        "The list should be deleted, but still exists."
    );
}
