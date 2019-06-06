# AtCoder Problems

[![Build Status](https://travis-ci.org/kenkoooo/AtCoderProblems.svg?branch=master)](https://travis-ci.org/kenkoooo/AtCoderProblems)
[![codecov](https://codecov.io/gh/kenkoooo/AtCoderProblems/branch/master/graph/badge.svg)](https://codecov.io/gh/kenkoooo/AtCoderProblems)



# atcoder-problems-api-lambda

`atcoder-problems-api-lambda` is a backend API server which runs on AWS Lambda.

# atcoder-problems-dumper-lambda

`atcoder-problems-dumper-lambda` is a tool to dump data in PostgreSQL to AWS S3.

# atcoder-problems-frontend

`atcoder-problems-frontend` is a web application written in TypeScript.

## Install required packages
```
yarn
```

## Start the web application on your local
```
yarn start
```

## Build optimized files for distribution
```
yarn build
```

# atcoder-problems-scraper

`atcoder-problems-scraper` is a tool to crawl AtCoder's webpages and store to PostgreSQL. 

## Build
```bash
cargo build
```

## Run
Before running, please make sure the URL of PostgreSQL is set to `SQL_URL`, and [SQL table schema](config/database-definition.sql) is loaded on your database.

```bash
cargo run --bin contest_problem_crawler # which crawls problems and contests
cargo run --bin all_submission_crawler # which crawls all the submissions
cargo run --bin naive_submission_crawler # which crawls only new submissions in each contests
```

# atcoder-problems-updater-lambda
`atcoder-problems-updater-lambda` is a tool to execute SQL commands to aggregate data on the database.


# Docker

```bash
#build Dockerfile
docker build ./

#run docker image
docker run -h spam -i -t {image_name} /bin/bash

#after you entered shell
#please start db server
service postgresql start

```
You can login db server with this user:name="kenkoooo",password="pass",dbname="test".
This docker image has everything you need for building and testing this repository(including prepared db server).
You can use git to get data and start testing.

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

(The API `info/*` are deprecated. Please use new API.)

## Statistics API

- Accepted Count
  - https://kenkoooo.com/atcoder/resources/ac.json
- Rated Point Sum
  - https://kenkoooo.com/atcoder/resources/sums.json
- Accepted Count for each language
  - https://kenkoooo.com/atcoder/resources/lang.json
- Minimum performances for each problems
  - https://kenkoooo.com/atcoder/resources/problem-performances.json

(The API `info/*` are deprecated. Please use new API.)

## UserInfo API
- https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=kenkoooo

## Submission API
- https://kenkoooo.com/atcoder/atcoder-api/results?user=wata

(The API `results?user=wata&rivals=iwiwi,chokudai` is obsoleted since it's difficult to cache. Please call above API 3 times as `results?user=wata`, `results?user=iwiwi` and `results?user=chokudai`.)

# Dataset

- [SQL version] https://s3-ap-northeast-1.amazonaws.com/kenkoooo/atcoder.sql
- [CSV version] https://s3-ap-northeast-1.amazonaws.com/kenkoooo/atcoder_submissions.csv

You can download whole data, which are crawled by the crawler.
