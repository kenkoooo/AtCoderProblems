# AtCoder Problems

[![Build Status](https://travis-ci.org/kenkoooo/AtCoderProblems.svg?branch=master)](https://travis-ci.org/kenkoooo/AtCoderProblems)
[![codecov](https://codecov.io/gh/kenkoooo/AtCoderProblems/branch/master/graph/badge.svg)](https://codecov.io/gh/kenkoooo/AtCoderProblems)

# Backend API Server

API server application and scrapers are written in Scala.

## Build

```bash
sbt assembly
```

## Test
To run all the tests, you need to prepare PostgreSQL with a test database.

```bash
sbt test
```

## Run 
After running the build command, you will have `target/scala-*/atcoder-problems-assembly-*.jar`. It is a `.jar` package, which is executable of Java. You can run the API server by the following command with a configuration files `env.json`. Please make sure you already have the PostgreSQL environment with required databases before running.
A sample of the config file and the schema file of the database are in [atcoder-problems-backend/src/test/resources](https://github.com/kenkoooo/AtCoderProblems/tree/master/atcoder-problems-backend/src/test/resources).
```bash
java -jar target/scala-*/atcoder-problems-*.jar env.json
```

# Frontend Web Application

Frontend web application is written in TypeScript.

## Build

```bash
# install node modules
npm install

# generate js file and source map
webpack

# generate minified js file
npm run build
```

## Test

```bash
npm test
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

## Statistics API

- Accepted Count
  - https://kenkoooo.com/atcoder/resources/ac.json
- Shortest Code Count
  - https://kenkoooo.com/atcoder/resources/short.json
- Fastest Code Count
  - https://kenkoooo.com/atcoder/resources/fast.json
- First Accepted Count
  - https://kenkoooo.com/atcoder/resources/first.json
- Rated Point Sum
  - https://kenkoooo.com/atcoder/resources/sums.json
- Accepted Count for each langages
  - https://kenkoooo.com/atcoder/resources/lang.json

## UserInfo API
- https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=kenkoooo

## Submission API
- https://kenkoooo.com/atcoder/atcoder-api/results?user=wata

(The API `results?user=wata&rivals=iwiwi,chokudai` is obsoleted since it's difficult to cache. Please call above API 3 times as `results?user=wata`, `results?user=iwiwi` and `results?user=chokudai`.)

# Dataset

- [SQL version] https://s3-ap-northeast-1.amazonaws.com/kenkoooo/atcoder.sql
- [CSV version] https://s3-ap-northeast-1.amazonaws.com/kenkoooo/atcoder_submissions.csv

You can download whole data, which are crawled by the official crawler.
