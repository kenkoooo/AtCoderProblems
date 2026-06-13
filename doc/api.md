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
https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=kenkoooo
```

### Rated Point Sum

#### Example

```
https://kenkoooo.com/atcoder/atcoder-api/v3/rated_point_sum_ranking?from=0&to=10
https://kenkoooo.com/atcoder/atcoder-api/v3/user/rated_point_sum_rank?user=kenkoooo
```

### Longest Streak (JST) Count

#### Example

```
https://kenkoooo.com/atcoder/atcoder-api/v3/streak_ranking?from=0&to=10
https://kenkoooo.com/atcoder/atcoder-api/v3/user/streak_rank?user=kenkoooo
```

### Language List

#### Example

```
https://kenkoooo.com/atcoder/atcoder-api/v3/language_list
```

### Accepted Count for each language

#### Example

```
https://kenkoooo.com/atcoder/atcoder-api/v3/language_ranking?from=0&to=10&language=Rust
https://kenkoooo.com/atcoder/atcoder-api/v3/user/language_rank?user=kenkoooo
```

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

### Submissions at the time

#### Interface

```
https://kenkoooo.com/atcoder/atcoder-api/v3/from/{unix_time_second}
```

#### Example

- https://kenkoooo.com/atcoder/atcoder-api/v3/from/1505342145

## Deprecated

- `/atcoder-api/v2/user_info`
- `/atcoder-api/info/*`
- `/atcoder-api/results`
- `/resources/ac.json`
- `/resources/lang.json`
- `/resources/streaks.json`
- `/resources/sums.json`

## Datasets

### Submissions

This will be updated once a week.

- https://s3-ap-northeast-1.amazonaws.com/kenkoooo/submissions.csv.gz

### Estimated Difficulties of the Problems

- https://kenkoooo.com/atcoder/resources/problem-models.json
