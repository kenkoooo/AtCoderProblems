#![allow(clippy::unwrap_used, clippy::expect_used)]

use async_trait::async_trait;
use crawler::{CrawlerError, Problem, ProblemFetcher};
use mockall::mock;
use sea_orm::{ConnectionTrait, Database, DatabaseConnection, DbErr, EntityTrait, Schema, Set};

mock! {
    pub ProblemFetcher {}

    #[async_trait]
    impl ProblemFetcher for ProblemFetcher {
        async fn fetch_problems(&self, contest_id: &str) -> Result<Vec<Problem>, CrawlerError>;
    }
}

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

    // Create contest_problem table
    let stmt = schema.create_table_from_entity(sql_entities::contest_problem::Entity);
    db.execute(builder.build(&stmt)).await?;

    Ok(db)
}

#[tokio::test]
async fn test_crawl_problems_inserts_problems_for_contests_without_problems() {
    let db = setup_db().await.unwrap();

    // Insert contests
    for id in ["abc001", "abc002", "abc003"] {
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

    // Insert problems only for abc001 (so abc002 and abc003 need crawling)
    sql_entities::problems::Entity::insert(sql_entities::problems::ActiveModel {
        id: Set("abc001_a".to_string()),
        contest_id: Set("abc001".to_string()),
        problem_index: Set("A".to_string()),
        name: Set("Existing Problem".to_string()),
        title: Set("A. Existing Problem".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Insert into contest_problem for abc001
    sql_entities::contest_problem::Entity::insert(sql_entities::contest_problem::ActiveModel {
        contest_id: Set("abc001".to_string()),
        problem_id: Set("abc001_a".to_string()),
        problem_index: Set("A".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Setup mock
    let mut mock_fetcher = MockProblemFetcher::new();

    mock_fetcher
        .expect_fetch_problems()
        .withf(|contest_id| contest_id == "abc002")
        .times(1)
        .returning(|_| {
            Ok(vec![
                Problem {
                    id: "abc002_a".to_string(),
                    contest_id: "abc002".to_string(),
                    problem_index: "A".to_string(),
                    name: "Problem A".to_string(),
                },
                Problem {
                    id: "abc002_b".to_string(),
                    contest_id: "abc002".to_string(),
                    problem_index: "B".to_string(),
                    name: "Problem B".to_string(),
                },
            ])
        });

    mock_fetcher
        .expect_fetch_problems()
        .withf(|contest_id| contest_id == "abc003")
        .times(1)
        .returning(|_| {
            Ok(vec![Problem {
                id: "abc003_a".to_string(),
                contest_id: "abc003".to_string(),
                problem_index: "A".to_string(),
                name: "Problem A".to_string(),
            }])
        });

    // Run the crawl
    let inserted = atcoder_problems_backend::crawler_utils::crawl_problems(&mock_fetcher, &db)
        .await
        .unwrap();

    // Verify results
    assert_eq!(inserted, 3); // 2 from abc002 + 1 from abc003

    // Check problems table
    let all_problems = sql_entities::problems::Entity::find()
        .all(&db)
        .await
        .unwrap();

    assert_eq!(all_problems.len(), 4); // 1 existing + 3 new
    assert!(all_problems.iter().any(|p| p.id == "abc001_a"));
    assert!(all_problems.iter().any(|p| p.id == "abc002_a"));
    assert!(all_problems.iter().any(|p| p.id == "abc002_b"));
    assert!(all_problems.iter().any(|p| p.id == "abc003_a"));

    // Check contest_problem table
    let all_contest_problems = sql_entities::contest_problem::Entity::find()
        .all(&db)
        .await
        .unwrap();

    assert_eq!(all_contest_problems.len(), 4); // 1 existing + 3 new
    assert!(
        all_contest_problems
            .iter()
            .any(|cp| cp.contest_id == "abc001" && cp.problem_id == "abc001_a")
    );
    assert!(
        all_contest_problems
            .iter()
            .any(|cp| cp.contest_id == "abc002" && cp.problem_id == "abc002_a")
    );
    assert!(
        all_contest_problems
            .iter()
            .any(|cp| cp.contest_id == "abc002" && cp.problem_id == "abc002_b")
    );
    assert!(
        all_contest_problems
            .iter()
            .any(|cp| cp.contest_id == "abc003" && cp.problem_id == "abc003_a")
    );
}

#[tokio::test]
async fn test_crawl_problems_skips_contests_with_existing_problems() {
    let db = setup_db().await.unwrap();

    // Insert a contest that already has problems
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

    sql_entities::problems::Entity::insert(sql_entities::problems::ActiveModel {
        id: Set("abc001_a".to_string()),
        contest_id: Set("abc001".to_string()),
        problem_index: Set("A".to_string()),
        name: Set("Existing Problem".to_string()),
        title: Set("A. Existing Problem".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Insert into contest_problem (this is what we check now)
    sql_entities::contest_problem::Entity::insert(sql_entities::contest_problem::ActiveModel {
        contest_id: Set("abc001".to_string()),
        problem_id: Set("abc001_a".to_string()),
        problem_index: Set("A".to_string()),
    })
    .exec(&db)
    .await
    .unwrap();

    // Setup mock - should not be called since all contests have problems
    let mock_fetcher = MockProblemFetcher::new();

    // Run the crawl
    let inserted = atcoder_problems_backend::crawler_utils::crawl_problems(&mock_fetcher, &db)
        .await
        .unwrap();

    assert_eq!(inserted, 0);
}

#[tokio::test]
async fn test_crawl_problems_handles_empty_response() {
    let db = setup_db().await.unwrap();

    // Insert a contest without problems
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

    // Setup mock to return empty vec
    let mut mock_fetcher = MockProblemFetcher::new();
    mock_fetcher
        .expect_fetch_problems()
        .times(1)
        .returning(|_| Ok(vec![]));

    // Run the crawl
    let inserted = atcoder_problems_backend::crawler_utils::crawl_problems(&mock_fetcher, &db)
        .await
        .unwrap();

    assert_eq!(inserted, 0);

    let all_problems = sql_entities::problems::Entity::find()
        .all(&db)
        .await
        .unwrap();

    assert_eq!(all_problems.len(), 0);
}

#[tokio::test]
async fn test_crawl_problems_generates_correct_title() {
    let db = setup_db().await.unwrap();

    // Insert a contest without problems
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

    // Setup mock
    let mut mock_fetcher = MockProblemFetcher::new();
    mock_fetcher
        .expect_fetch_problems()
        .times(1)
        .returning(|_| {
            Ok(vec![Problem {
                id: "abc001_a".to_string(),
                contest_id: "abc001".to_string(),
                problem_index: "A".to_string(),
                name: "Test Problem".to_string(),
            }])
        });

    // Run the crawl
    atcoder_problems_backend::crawler_utils::crawl_problems(&mock_fetcher, &db)
        .await
        .unwrap();

    // Verify the title was generated correctly
    let problem = sql_entities::problems::Entity::find()
        .all(&db)
        .await
        .unwrap()
        .into_iter()
        .next()
        .unwrap();

    assert_eq!(problem.title, "A. Test Problem");

    // Verify contest_problem was also inserted
    let contest_problem = sql_entities::contest_problem::Entity::find()
        .all(&db)
        .await
        .unwrap()
        .into_iter()
        .next()
        .unwrap();

    assert_eq!(contest_problem.contest_id, "abc001");
    assert_eq!(contest_problem.problem_id, "abc001_a");
    assert_eq!(contest_problem.problem_index, "A");
}
