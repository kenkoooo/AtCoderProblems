# Change Log

## 2019-12-09
- [#343](https://github.com/kenkoooo/AtCoderProblems/pull/343) Upgraded `actix-web` to `2.0.0-alpha.4`
- [#342](https://github.com/kenkoooo/AtCoderProblems/pull/342) Fixed `grcov` command lines in the Travis config.
- [#341](https://github.com/kenkoooo/AtCoderProblems/pull/341) Fixed the Travis config to use the latest `grcov`.
- [#340](https://github.com/kenkoooo/AtCoderProblems/pull/340) Fixed es-lint warnings.
- [#339](https://github.com/kenkoooo/AtCoderProblems/pull/339) Configured the CORS header of the server response.
- [#338](https://github.com/kenkoooo/AtCoderProblems/pull/338) Added `fix_invalid_submissions`.
- [#337](https://github.com/kenkoooo/AtCoderProblems/pull/337) Added `variance` to the Problem Model API.

## 2019-12-07
- [#334](https://github.com/kenkoooo/AtCoderProblems/pull/334) Upgraded npm packages.
- [#332](https://github.com/kenkoooo/AtCoderProblems/pull/332) Added an `actix-web` based server application.

## 2019-12-05
- [#331](https://github.com/kenkoooo/AtCoderProblems/pull/331) Added `batch_update`

## 2019-11-21
- [#326](https://github.com/kenkoooo/AtCoderProblems/pull/326) Added a button to exclude experimental results.
- [#325](https://github.com/kenkoooo/AtCoderProblems/pull/325) Added a new SQL table to cache the result.

## 2019-11-16
- [#324](https://github.com/kenkoooo/AtCoderProblems/pull/324) Trimming of the string of the text form.

## 2019-11-01
- [#322](https://github.com/kenkoooo/AtCoderProblems/pull/322)  Added an option to hide experimental recommendations. 

## 2019-10-27
- [#320](https://github.com/kenkoooo/AtCoderProblems/pull/320) Refactoring of LanguageOwners.
- [#319](https://github.com/kenkoooo/AtCoderProblems/pull/319) Enabled to choose the number of shown language owners.
- [#318](https://github.com/kenkoooo/AtCoderProblems/pull/318) Difficulty estimation for old contests.

## 2019-10-24
- [#316](https://github.com/kenkoooo/AtCoderProblems/pull/316) Stop aggregating before-contest submissions.
- [#314](https://github.com/kenkoooo/AtCoderProblems/pull/314) Ported aggregation functions from Rust to SQL.

## 2019-10-23
- [#313](https://github.com/kenkoooo/AtCoderProblems/pull/313) Added `error::Error`.
- [#312](https://github.com/kenkoooo/AtCoderProblems/pull/312) Created SQL updater for AWS Lambda.
- [#310](https://github.com/kenkoooo/AtCoderProblems/pull/310) Removed unused AWS Lambda functions.

## 2019-10-20
- [#308](https://github.com/kenkoooo/AtCoderProblems/pull/308) Created a new Docker container for `backend`.
- [#307](https://github.com/kenkoooo/AtCoderProblems/pull/307) Compressed `submissions.csv`.

## 2019-10-19
- [#306](https://github.com/kenkoooo/AtCoderProblems/pull/306) Added ts-lint check into CI.
- [#305](https://github.com/kenkoooo/AtCoderProblems/pull/305) Removed unused python scripts.  

## 2019-10-18
- [#304](https://github.com/kenkoooo/AtCoderProblems/pull/304) Fixed the margins.
- [#303](https://github.com/kenkoooo/AtCoderProblems/pull/303) Installed ts-lint and Prettier.  

## 2019-10-15
- [#300](https://github.com/kenkoooo/AtCoderProblems/pull/300) Removed corrupted difficulty.
- [#299](https://github.com/kenkoooo/AtCoderProblems/pull/299) Updated `Docker.crawler` to reduce the image size.

## 2019-10-14
- [#297](https://github.com/kenkoooo/AtCoderProblems/pull/297) Updated `Docker.crawler` to fix the compile errors in DockerHub.
- [#296](https://github.com/kenkoooo/AtCoderProblems/pull/296) Updated `rusoto` to fix the compile errors.
- [#294](https://github.com/kenkoooo/AtCoderProblems/pull/294) Updated the difficulty estimation algorithm.
- [#293](https://github.com/kenkoooo/AtCoderProblems/pull/293) Updated the sql backup script to compress the CSV file.
- [#291](https://github.com/kenkoooo/AtCoderProblems/pull/291) Updated crawler to handle DB connection errors.
