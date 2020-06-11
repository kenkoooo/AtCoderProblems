# AtCoder Problems API / Datasets

We unofficially provide API to get information about AtCoder.

## Caution

- Please don't hit API so often. Please sleep for more than 1 second between accesses.
- We sometimes deprecate old APIs and replace them with new ones. Please carefully watch this repository and update your application to use the latest API.

## Information API
### Contests Information
- https://kenkoooo.com/atcoder/resources/contests.json
### Problems Information 
- https://kenkoooo.com/atcoder/resources/problems.json
### Detailed Problems Information
- https://kenkoooo.com/atcoder/resources/merged-problems.json
### Pairs of Contests and Problems
- https://kenkoooo.com/atcoder/resources/contest-problem.json

## Statistics API
### Accepted Count
- https://kenkoooo.com/atcoder/resources/ac.json
### Rated Point Sum
- https://kenkoooo.com/atcoder/resources/sums.json
### Longest Streak (JST) Count
- https://kenkoooo.com/atcoder/resources/streaks.json
### Accepted Count for each language
- https://kenkoooo.com/atcoder/resources/lang.json

## Submission API
### User Submissions
#### Interface
```
https://kenkoooo.com/atcoder/atcoder-api/results?user={user_id}
```
#### Example
- https://kenkoooo.com/atcoder/atcoder-api/results?user=wata

### Submissions at the time
#### Interface
```
https://kenkoooo.com/atcoder/atcoder-api/v3/from/{unix_time_second}
```
#### Example
- https://kenkoooo.com/atcoder/atcoder-api/v3/from/1505342145

## Datasets
### Submissions
This will be updated once a week.
- https://s3-ap-northeast-1.amazonaws.com/kenkoooo/submissions.csv.gz

### Estimated Difficulties of the Problems
- https://kenkoooo.com/atcoder/resources/problem-models.json
