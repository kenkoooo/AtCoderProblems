# AtCoder Problems dbt

Data pipeline for aggregating AtCoder Problems statistics.

## Models

### Staging (views)
- `stg_contests` - Contests with computed `is_rated` flag
- `stg_problems` - Problems
- `stg_contest_problem` - Contest-problem mapping
- `stg_submissions` - Submissions with bot users filtered out

### Marts (tables)
- `accepted_count` - Count of distinct problems solved per user
- `solver` - Count of distinct users who solved each problem
- `points` - Max points for each problem from rated contests
- `rated_point_sum` - Sum of rated points per user
- `language_count` - Problems solved per language per user
- `max_streaks` - Max consecutive days with AC per user
- `fastest` - Fastest AC submission per problem
- `shortest` - Shortest AC submission per problem
- `first` - First AC submission per problem

## Usage

Run from the repository root:

```bash
# Start postgres
docker compose up -d postgres

# Run dbt (seed → run → test in dependency order)
docker compose run --rm dbt build
```

Individual commands:

```bash
docker compose run --rm dbt seed   # Load excluded_users seed
docker compose run --rm dbt run    # Run all models
docker compose run --rm dbt test   # Run tests
```

**Note:** `dbt seed` must be run before `dbt run` because `stg_submissions` depends on `excluded_users`.
