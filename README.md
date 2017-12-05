# AtCoder Problems

[![Build Status](https://travis-ci.org/kenkoooo/AtCoderProblems.svg?branch=master)](https://travis-ci.org/kenkoooo/AtCoderProblems)
[![codecov](https://codecov.io/gh/kenkoooo/AtCoderProblems/branch/master/graph/badge.svg)](https://codecov.io/gh/kenkoooo/AtCoderProblems)

# Backend

API server application and scrapers are written in Scala.

## Build

```bash
sbt assembly
```

## Test

```bash
sbt test
```

# Frontend

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
  - http://beta.kenkoooo.com/atcoder/atcoder-api/info/contests
- Problems Information
  - http://beta.kenkoooo.com/atcoder/atcoder-api/info/problems
- Detailed Problems Information
  - http://beta.kenkoooo.com/atcoder/atcoder-api/info/merged-problems

## User Information API

- Accepted Count
  - http://beta.kenkoooo.com/atcoder/atcoder-api/info/ac
- Shortest Code Count
  - http://beta.kenkoooo.com/atcoder/atcoder-api/info/short
- Fastest Code Count
  - http://beta.kenkoooo.com/atcoder/atcoder-api/info/fast
_ First Accepted Count
  - http://beta.kenkoooo.com/atcoder/atcoder-api/info/first

## Submission API
  - http://beta.kenkoooo.com/atcoder/atcoder-api/results?user=wata&rivals=iwiwi,chokudai
