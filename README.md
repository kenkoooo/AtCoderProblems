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

## Information API

- Contests Information
  - https://kenkoooo.com/atcoder/atcoder-api/info/contests
- Problems Information
  - https://kenkoooo.com/atcoder/atcoder-api/info/problems
- Detailed Problems Information
  - https://kenkoooo.com/atcoder/atcoder-api/info/merged-problems

## Statistics API

- Accepted Count
  - https://kenkoooo.com/atcoder/atcoder-api/info/ac
- Shortest Code Count
  - https://kenkoooo.com/atcoder/atcoder-api/info/short
- Fastest Code Count
  - https://kenkoooo.com/atcoder/atcoder-api/info/fast
- First Accepted Count
  - https://kenkoooo.com/atcoder/atcoder-api/info/first
- Rated Point Sum
  - https://kenkoooo.com/atcoder/atcoder-api/info/sums
- Accepted Count for each langages
  - https://kenkoooo.com/atcoder/atcoder-api/info/lang
- Predicted Rating for each user
  - https://kenkoooo.com/atcoder/atcoder-api/info/predicted-ratings

## UserInfo API
- https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=kenkoooo

## Submission API
- https://kenkoooo.com/atcoder/atcoder-api/results?user=wata

(The API `results?user=wata&rivals=iwiwi,chokudai` is obsoleted since it's difficult to cache. Please call above API 3 times as `results?user=wata`, `results?user=iwiwi` and `results?user=chokudai`.)

# Dataset

- https://s3-ap-northeast-1.amazonaws.com/kenkoooo/atcoder.sql

You can download whole data, which are crawled by the official crawler.
