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

#### Example
```
https://kenkoooo.com/atcoder/atcoder-api/v3/ac_ranking?from=0&to=10
```

Deprecated ~~https://kenkoooo.com/atcoder/resources/ac.json~~

### Rated Point Sum

- https://kenkoooo.com/atcoder/resources/sums.json

### Longest Streak (JST) Count

- https://kenkoooo.com/atcoder/resources/streaks.json

### Accepted Count for each language

- https://kenkoooo.com/atcoder/resources/lang.json

## Submission API

### User Submissions

Returns a list of submissions of the specified user.
You need to specify a time, and up to 500 submissions after the specified time will be returned.

#### Interface

```
https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user={user_id}&from_second={unix_second}
```

#### Example

```
https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=chokudai&from_second=1560046356
```

### [Deprecated] ~~User Submissions~~

This API is deprecated. Please use `/v3/user/submissions` instead. You can see more detail about the deprecation plan ([#961](https://github.com/kenkoooo/AtCoderProblems/issues/961)).

#### Interface

```
https://kenkoooo.com/atcoder/atcoder-api/results?user={user_id}
```

### Submissions at the time

#### Interface

```
https://kenkoooo.com/atcoder/atcoder-api/v3/from/{unix_time_second}
```

#### Example

- https://kenkoooo.com/atcoder/atcoder-api/v3/from/1505342145

## Deprecated

- `/v2/user_info`
- `/atcoder/atcoder-api/info/*`

## Datasets

### Submissions

This will be updated once a week.

- https://s3-ap-northeast-1.amazonaws.com/kenkoooo/submissions.csv.gz

### Estimated Difficulties of the Problems

- https://kenkoooo.com/atcoder/resources/problem-models.json
