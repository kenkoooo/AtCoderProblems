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
# generate js file and source map
webpack

# generate minified js file
npm run build
```

## Test

```bash
npm test
```
