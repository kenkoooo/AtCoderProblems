# AtCoder Problems

[![Build Status](https://travis-ci.org/kenkoooo/AtCoderProblems.svg?branch=master)](https://travis-ci.org/kenkoooo/AtCoderProblems)

# atcoder-problems-frontend

`atcoder-problems-frontend` is a web application written in TypeScript.

## Install required packages
```bash
yarn
```

## Start the web application on your local
```bash
yarn start
```

## Build optimized files for distribution
```bash
yarn build
```

## Fix code format
```bash
yarn lint:fix
```

## Run end-to-end test

```bash
yarn cypress:run
```

## Open Cypress window

```bash
yarn cypress:open
```

# atcoder-problems-backend

`atcoder-problems-backend` is a set of backend applications written in Rust.

Since the web app, which is running in your local, will connect to the
production backend server, you don't need to run backend applications in most cases.

## Build
```bash
cd atcoder-problems-backend/
cargo build
```

## Run
```bash
export SQL_URL=... # URL of PostgreSQL 
export CLIENT_ID=... # GitHub client_id, which is required to use login function.
export CLIENT_SECRET=... # GitHub client_secret, which is required to use login function.

# Run backend server
cargo run --bin run_server

# Run crawlers
cargo run --bin crawl_all_submissions
cargo run --bin crawl_for_virtual_contests
cargo run --bin crawl_from_new_contests
cargo run --bin crawl_problems
cargo run --bin crawl_recent_submissions
cargo run --bin crawl_whole_contest

# Run other tools
cargo run --bin batch_update
cargo run --bin delta_update
cargo run --bin dump_json
cargo run --bin fix_invalid_submissions
```

# API

Please use API politely.
Especially, please ensure using cache and adding delay if you develop a bot.

APIは行儀良く利用してください。
特にbotを開発している場合は、ETagを用いたキャッシュを利用し、連続して呼び出す際はある程度 (例えば1秒) の遅延をはさむようにしてください。
1日に数万回以上のリクエストをしたい場合は事前に相談してください。

ブラウザ上からJavaScriptで直接利用している場合はあまり気にする必要はありません。
キャッシュはブラウザがよしなにやってくれますし、呼び出し回数もたいてい多くならないためです。
botの場合も1日に1000回以下程度のリクエストであればたいした負荷にはならないので心配する必要はありません。

## Information API

- Contests Information
  - https://kenkoooo.com/atcoder/resources/contests.json
- Problems Information
  - https://kenkoooo.com/atcoder/resources/problems.json
- Detailed Problems Information
  - https://kenkoooo.com/atcoder/resources/merged-problems.json
- Pairs of contests and problems
  - https://kenkoooo.com/atcoder/resources/contest-problem.json

## Statistics API

- Accepted Count
  - https://kenkoooo.com/atcoder/resources/ac.json
- Rated Point Sum
  - https://kenkoooo.com/atcoder/resources/sums.json
- Longest Streak (JST) Count
  - https://kenkoooo.com/atcoder/resources/streaks.json
- Accepted Count for each language
  - https://kenkoooo.com/atcoder/resources/lang.json

## Submission API
- https://kenkoooo.com/atcoder/atcoder-api/results?user=wata

## Time-based Submission API
### Interface
```
https://kenkoooo.com/atcoder/atcoder-api/v3/from/{unix_time_second}
```
### Example
- https://kenkoooo.com/atcoder/atcoder-api/v3/from/1505342145

# Dataset

## Submissions

This will be updated once a week.

- https://s3-ap-northeast-1.amazonaws.com/kenkoooo/submissions.csv.gz

## Estimated difficulties of the problems
- https://kenkoooo.com/atcoder/resources/problem-models.json
