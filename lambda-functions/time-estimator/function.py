import json
import math
from datetime import datetime
import random

import boto3
import requests


def single_regression(x, y):
    n = len(x)
    x_sum = sum(x)
    y_sum = sum(y)
    xy_sum = sum(x * y for x, y in zip(x, y))
    sqx_sum = sum(x ** 2 for x in x)
    slope = (n * xy_sum - x_sum * y_sum) / (n * sqx_sum - x_sum ** 2)
    intercept = (sqx_sum * y_sum - xy_sum * x_sum) / (n * sqx_sum - x_sum ** 2)
    return slope, intercept


def safe_log(x):
    return math.log(max(x, 10 ** -100))


def safe_sigmoid(x):
    return 1. / (1. + math.exp(min(x, 750)))


def fit_2plm_irt(xs, ys):
    iter_n = max(100000 // len(xs), 1)

    eta = 1.
    x_scale = 1000.

    scxs = [x / x_scale for x in xs]
    samples = list(zip(scxs, ys))

    a, b = 0., 0.
    r_a, r_b = 1., 1.
    iterations = []
    for iteration in range(iter_n):
        logl = 0.
        for x, y in samples:
            p = safe_sigmoid(a * x + b)
            logl += safe_log(p if y == 1. else (1 - p))
        iterations.append((logl, a, b))

        random.shuffle(samples)
        for x, y in samples:
            p = safe_sigmoid(a * x + b)
            grad_a = x * (p - y)
            grad_b = (p - y)
            r_a += grad_a ** 2
            r_b += grad_b ** 2
            a += eta * grad_a / r_a ** 0.5
            b += eta * grad_b / r_b ** 0.5
    best_logl, a, b = max(iterations)
    a /= x_scale
    return -b / a, -a


def inverse_adjust_rating(rating, prev_contests):
    if rating <= 0:
        return float("nan")
    if rating <= 400:
        rating = 400 * (1 - math.log(400 / rating))
    adjustment = (math.sqrt(1 - (0.9 ** (2 * prev_contests))) / (1 - 0.9 ** prev_contests) - 1) / (math.sqrt(19) - 1) * 1200
    return rating + adjustment


def estimate_for_contest(contest_name):
    try:
        results = requests.get("https://atcoder.jp/contests/{}/standings/json".format(contest_name)).json()
    except json.JSONDecodeError as e:
        print(f"{e}")
        return {}
    task_names = {task["TaskScreenName"]: task["TaskName"] for task in results["TaskInfo"]}

    user_results = []
    for result_row in results["StandingsData"]:
        total_submissions = result_row["TotalResult"]["Count"]
        if total_submissions == 0:
            continue

        is_rated = result_row["IsRated"]
        rating = result_row["OldRating"]
        prev_contests = result_row["Competitions"]
        user_name = result_row["UserScreenName"]
        if prev_contests <= 0:
            continue
        if rating <= 0:
            continue

        user_row = {
            "is_rated": is_rated,
            "rating": rating,
            "prev_contests" : prev_contests,
            "raw_rating": inverse_adjust_rating(rating, prev_contests),
            "user_name": user_name
        }
        for task_name in task_names:
            user_row[task_name + ".ac"] = 0.
            user_row[task_name + ".time"] = -1.
            user_row[task_name + ".elapsed"] = 10 ** 200

        prev_accepted_times = [0] + [task_result["Elapsed"] for task_result in result_row["TaskResults"].values() if task_result["Score"] > 0]
        user_row["last_ac"] = max(prev_accepted_times)
        for task_screen_name, task_result in result_row["TaskResults"].items():
            if task_result["Score"] > 0:
                user_row[task_screen_name + ".ac"] = 1.
                elapsed = task_result["Elapsed"]
                penalty = task_result["Penalty"] * 5 * 60 * (10 ** 9)
                user_row[task_screen_name + ".elapsed"] = elapsed
                user_row[task_screen_name + ".time"] = penalty + elapsed - max(t for t in prev_accepted_times if t < elapsed)
        user_results.append(user_row)

    if len(user_results) == 0:
        print(f"There are no participants/submissions for contest {contest_name}. Ignoring.")
        return {}

    params = {}
    for task_screen_name, task_name in task_names.items():
        elapsed = [task_result[task_screen_name + ".elapsed"] for task_result in user_results]
        first_ac = min(elapsed)
        valid_users = [task_result for task_result in user_results
                       if task_result[task_screen_name + ".time"] > first_ac / 2 and task_result[task_screen_name + ".ac"] == 1.]
        model = {}
        if len(valid_users) < 10:
            print(f"{task_screen_name}: insufficient data ({len(valid_users)} users). skip estimating time model.")
        else:
            raw_ratings = [task_result["raw_rating"] for task_result in valid_users]
            time_secs = [task_result[task_screen_name + ".time"] / (10 ** 9) for task_result in valid_users]
            time_logs = [math.log(t) for t in time_secs]
            slope, intercept = single_regression(raw_ratings, time_logs)
            print(f"{task_screen_name}: time [sec] = exp({slope} * raw_rating + {intercept})")
            if slope > 0:
                print("slope is positive. ignoring unreliable estimation.")
            else:
                model["slope"] = slope
                model["intercept"] = intercept

        rated_results = [task_result for task_result in user_results if task_result["is_rated"]]
        if len(rated_results) < 10:
            print(f"{task_screen_name}: insufficient data ({len(rated_results)} users). skip estimating difficulty model.")
        else:
            d_raw_ratings = [task_result["raw_rating"] for task_result in rated_results]
            d_accepteds = [task_result[task_screen_name + ".ac"] for task_result in rated_results]
            difficulty, discrimination = fit_2plm_irt(d_raw_ratings, d_accepteds)
            print(f"difficulty: {difficulty}, discrimination: {discrimination}")
            if discrimination < 0:
                print("discrimination is negative. ignoring unreliable estimation.")
            else:
                model["difficulty"] = difficulty
                model["discrimination"] = discrimination
        if model:
            params[task_screen_name] = model
    return params


def all_contests():
    # Gets all contests after the rating system is introduced.
    # The first rated contest, AGC001 at 2016-07-16, is ignored because nobody has rating before the contest.
    contests = requests.get("https://kenkoooo.com/atcoder/resources/contests.json").json()
    valid_epoch_second = datetime(2016, 7, 17).timestamp()
    return [contest["id"] for contest in contests if contest["start_epoch_second"] > valid_epoch_second]


def handler(event, context):
    target = event.get("target") or all_contests()
    bucket = event.get("bucket", "kenkoooo.com")
    object_key = event.get("object_key", "resources/problem-models.json")

    print(f"Estimating time models of {len(target)} contests.")
    results = {}
    for contest in target:
        results.update(estimate_for_contest(contest))
    print("Estimation completed. Saving results in S3")
    s3 = boto3.resource('s3')
    s3.Object(bucket, object_key).put(Body=json.dumps(results))


if __name__ == '__main__':
    event = {
        "bucket": "amylase-kyotei"
    }
    handler(event, None)