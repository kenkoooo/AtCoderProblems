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
After running the build command, you will have `target/scala-*/atcoder-problems-assembly-*.jar`. It is a `.jar` package, which is executable of Java. You can run the API server by the following command with a configuration files `env.json`.
```bash
java -cp target/scala-*/atcoder-problems-*.jar
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
  - http://kenkoooo.com/atcoder/atcoder-api/info/contests
- Problems Information
  - http://kenkoooo.com/atcoder/atcoder-api/info/problems
- Detailed Problems Information
  - http://kenkoooo.com/atcoder/atcoder-api/info/merged-problems

## User Information API

- Accepted Count
  - http://kenkoooo.com/atcoder/atcoder-api/info/ac
- Shortest Code Count
  - http://kenkoooo.com/atcoder/atcoder-api/info/short
- Fastest Code Count
  - http://kenkoooo.com/atcoder/atcoder-api/info/fast
- First Accepted Count
  - http://kenkoooo.com/atcoder/atcoder-api/info/first
- Rated Point Sum
  - http://kenkoooo.com/atcoder/atcoder-api/info/sums
- Accepted Count for each langages
  - http://kenkoooo.com/atcoder/atcoder-api/info/lang
- Predicted Rating for each user
  - http://kenkoooo.com/atcoder/atcoder-api/info/predicted-ratings

## Submission API
  - http://kenkoooo.com/atcoder/atcoder-api/results?user=wata&rivals=iwiwi,chokudai
