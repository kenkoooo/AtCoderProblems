use crawler::Problem;
use sea_orm::{ConnectionTrait, Database, DatabaseConnection, DbErr, EntityTrait, Schema, Set};

async fn setup_db() -> Result<DatabaseConnection, DbErr> {
    let db = Database::connect("sqlite::memory:").await?;
    let builder = db.get_database_backend();
    let schema = Schema::new(builder);

    // Create contests table
    let stmt = schema.create_table_from_entity(sql_entities::contests::Entity);
    db.execute(builder.build(&stmt)).await?;

    // Create problems table
    let stmt = schema.create_table_from_entity(sql_entities::problems::Entity);
    db.execute(builder.build(&stmt)).await?;

    Ok(db)
}

#[tokio::test]
async fn test_get_all_contest_ids() {
    let db = setup_db().await.unwrap();

    // Insert test data
    sql_entities::contests::Entity::insert(sql_entities::contests::ActiveModel {
        id: Set("abc001".to_string()),
        start_epoch_second: Set(0),
        duration_second: Set(0),
        title: Set("Test Contest".to_string()),
        rate_change: Set("-".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    sql_entities::contests::Entity::insert(sql_entities::contests::ActiveModel {
        id: Set("abc002".to_string()),
        start_epoch_second: Set(0),
        duration_second: Set(0),
        title: Set("Test Contest".to_string()),
        rate_change: Set("-".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    sql_entities::contests::Entity::insert(sql_entities::contests::ActiveModel {
        id: Set("abc003".to_string()),
        start_epoch_second: Set(0),
        duration_second: Set(0),
        title: Set("Test Contest".to_string()),
        rate_change: Set("-".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Test
    let contest_ids = atcoder_problems_backend::crawler_utils::get_all_contest_ids(&db)
        .await
        .unwrap();

    assert_eq!(contest_ids.len(), 3);
    assert!(contest_ids.contains("abc001"));
    assert!(contest_ids.contains("abc002"));
    assert!(contest_ids.contains("abc003"));
}

#[tokio::test]
async fn test_get_contest_ids_with_problems() {
    let db = setup_db().await.unwrap();

    // Insert contests
    sql_entities::contests::Entity::insert(sql_entities::contests::ActiveModel {
        id: Set("abc001".to_string()),
        start_epoch_second: Set(0),
        duration_second: Set(0),
        title: Set("Test Contest".to_string()),
        rate_change: Set("-".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    sql_entities::contests::Entity::insert(sql_entities::contests::ActiveModel {
        id: Set("abc002".to_string()),
        start_epoch_second: Set(0),
        duration_second: Set(0),
        title: Set("Test Contest".to_string()),
        rate_change: Set("-".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    sql_entities::contests::Entity::insert(sql_entities::contests::ActiveModel {
        id: Set("abc003".to_string()),
        start_epoch_second: Set(0),
        duration_second: Set(0),
        title: Set("Test Contest".to_string()),
        rate_change: Set("-".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Insert problems only for abc001 and abc003
    sql_entities::problems::Entity::insert(sql_entities::problems::ActiveModel {
        id: Set("abc001_a".to_string()),
        contest_id: Set("abc001".to_string()),
        problem_index: Set("A".to_string()),
        name: Set("Test Problem".to_string()),
        title: Set("A. Test Problem".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    sql_entities::problems::Entity::insert(sql_entities::problems::ActiveModel {
        id: Set("abc003_a".to_string()),
        contest_id: Set("abc003".to_string()),
        problem_index: Set("A".to_string()),
        name: Set("Test Problem".to_string()),
        title: Set("A. Test Problem".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Test
    let contest_ids = atcoder_problems_backend::crawler_utils::get_contest_ids_with_problems(&db)
        .await
        .unwrap();

    assert_eq!(contest_ids.len(), 2);
    assert!(contest_ids.contains("abc001"));
    assert!(contest_ids.contains("abc003"));
    assert!(!contest_ids.contains("abc002"));
}

#[tokio::test]
async fn test_find_contests_without_problems() {
    let db = setup_db().await.unwrap();

    // Insert contests
    for id in ["abc001", "abc002", "abc003", "abc004"] {
        sql_entities::contests::Entity::insert(sql_entities::contests::ActiveModel {
            id: Set(id.to_string()),
            start_epoch_second: Set(0),
            duration_second: Set(0),
            title: Set("Test Contest".to_string()),
            rate_change: Set("-".to_string()),
        })
        .exec(&db)
        .await
        .unwrap();
    }

    // Insert problems only for abc001 and abc003
    sql_entities::problems::Entity::insert(sql_entities::problems::ActiveModel {
        id: Set("abc001_a".to_string()),
        contest_id: Set("abc001".to_string()),
        problem_index: Set("A".to_string()),
        name: Set("Test Problem".to_string()),
        title: Set("A. Test Problem".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    sql_entities::problems::Entity::insert(sql_entities::problems::ActiveModel {
        id: Set("abc003_a".to_string()),
        contest_id: Set("abc003".to_string()),
        problem_index: Set("A".to_string()),
        name: Set("Test Problem".to_string()),
        title: Set("A. Test Problem".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Get contest IDs using functions under test
    let all_contest_ids = atcoder_problems_backend::crawler_utils::get_all_contest_ids(&db)
        .await
        .unwrap();
    let contest_ids_with_problems =
        atcoder_problems_backend::crawler_utils::get_contest_ids_with_problems(&db)
            .await
            .unwrap();

    // Find contests without problems
    let mut contests_without_problems =
        atcoder_problems_backend::crawler_utils::find_contests_without_problems(
            all_contest_ids,
            contest_ids_with_problems,
        );
    contests_without_problems.sort();

    assert_eq!(contests_without_problems, vec!["abc002", "abc004"]);
}

#[tokio::test]
async fn test_upsert_problems() {
    let db = setup_db().await.unwrap();

    // Create problems to insert
    let problems = vec![
        Problem {
            id: "abc001_a".to_string(),
            contest_id: "abc001".to_string(),
            problem_index: "A".to_string(),
            name: "First Problem".to_string(),
        },
        Problem {
            id: "abc001_b".to_string(),
            contest_id: "abc001".to_string(),
            problem_index: "B".to_string(),
            name: "Second Problem".to_string(),
        },
    ];

    // Insert problems
    let inserted = atcoder_problems_backend::crawler_utils::upsert_problems(&db, problems)
        .await
        .unwrap();

    assert_eq!(inserted, 2);

    // Verify data in DB directly
    let all_problems = sql_entities::problems::Entity::find()
        .all(&db)
        .await
        .unwrap();

    assert_eq!(all_problems.len(), 2);
    assert!(all_problems.iter().any(|p| p.id == "abc001_a"));
    assert!(all_problems.iter().any(|p| p.id == "abc001_b"));
}

#[tokio::test]
async fn test_upsert_problems_updates_existing() {
    let db = setup_db().await.unwrap();

    // Insert initial problem
    let problems = vec![Problem {
        id: "abc001_a".to_string(),
        contest_id: "abc001".to_string(),
        problem_index: "A".to_string(),
        name: "Original Name".to_string(),
    }];

    atcoder_problems_backend::crawler_utils::upsert_problems(&db, problems)
        .await
        .unwrap();

    // Update problem with same ID
    let updated_problems = vec![Problem {
        id: "abc001_a".to_string(),
        contest_id: "abc001".to_string(),
        problem_index: "A".to_string(),
        name: "Updated Name".to_string(),
    }];

    let inserted = atcoder_problems_backend::crawler_utils::upsert_problems(&db, updated_problems)
        .await
        .unwrap();

    assert_eq!(inserted, 1);

    // Verify only one problem exists and it's updated
    let all_problems = sql_entities::problems::Entity::find()
        .all(&db)
        .await
        .unwrap();

    assert_eq!(all_problems.len(), 1);
    assert_eq!(all_problems[0].id, "abc001_a");
    assert_eq!(all_problems[0].name, "Updated Name");
    assert_eq!(all_problems[0].title, "A. Updated Name");
}
