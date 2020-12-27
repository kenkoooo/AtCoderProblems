import itertools
import json
import math
import random
import statistics
from collections import defaultdict
from html.parser import HTMLParser

import boto3
import requests

from rating import RatingSystem, ContestType


old_sponsored_contests = {
    "code-festival-2014-exhibition",
    "code-festival-2014-final",
    "code-festival-2014-morning-easy",
    "code-festival-2014-morning-hard",
    "code-festival-2014-morning-middle",
    "code-festival-2014-quala",
    "code-festival-2014-qualb",
    "code-festival-2015-exhibition",
    "code-festival-2015-morning-easy",
    "code-festival-2015-morning-hard",
    "code-festival-2015-morning-middle",
    "code-festival-2015-quala",
    "code-festival-2015-qualb",
    "code-formula-2014-final",
    "code-formula-2014-quala",
    "code-formula-2014-qualb",
    "digitalarts2012",
    "discovery2016-final",
    "discovery2016-qual",
    "donuts-2015",
    "dwango2015-finals",
    "dwango2015-prelims",
    "dwango2016-finals",
    "dwango2016-prelims",
    "indeednow-quala",
    "indeednow-qualb",
    "mujin-pc-2016",
    "tenka1-2012-final",
    "tenka1-2012-qualA",
    "tenka1-2012-qualB",
    "tenka1-2012-qualC",
    "tenka1-2013-final",
    "tenka1-2013-quala",
    "tenka1-2013-qualb",
    "tenka1-2014-final",
    "tenka1-2014-quala",
    "tenka1-2014-qualb",
    "tenka1-2015-final",
    "tenka1-2015-quala",
    "tenka1-2015-qualb",
}


prohibited_problem_ids = {
    "codefestival_2016_final_j",
    "discovery_2016_final_e",
    "arc047_d",
    "arc022_4",
    "tenka1_2013_qualB_d",
}


class AtCoderCSRFExtractor(HTMLParser):
    def __init__(self):
        super(AtCoderCSRFExtractor, self).__init__()
        self.csrf = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "input" and attrs.get("name") == "csrf_token":
            self.csrf = attrs["value"]

    def extract(self, html):
        self.feed(html)
        if self.csrf is not None:
            return self.csrf
        else:
            raise ValueError("Failed to extract CSRF token")


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
    return 1.0 / (1.0 + math.exp(min(-x, 750)))


def _fit_1plm_binary_search(xs, positive_count):
    discrimination = math.log(6.0) / 400.0
    lb, ub = -10000, 10000
    accepts = positive_count
    while ub - lb > 1:
        m = (ub + lb) // 2
        expected_accepts = 0
        for x in xs:
            expected_accepts += 1.0 / (1.0 + (6.0 ** ((m - x) / 400.0)))
        if expected_accepts < accepts:
            ub = m
        else:
            lb = m
    difficulty = lb
    return difficulty, discrimination


def fit_2plm_irt(xs, ys):
    return _fit_1plm_binary_search(xs, sum(ys))


def frange(start: float, end: float, step: float):
    v = start
    while (start - end) * (v - end) > 0:
        yield v
        v += step


def fit_3plm_irt(xs, ys):
    # grid search over retreat_proba
    accepts = sum(ys)
    iterations = []
    for retreat_proba in frange(0.0, 0.5, 0.025):
        participate_proba = 1 - retreat_proba
        difficulty, discrimination = _fit_1plm_binary_search(
            xs, accepts / participate_proba
        )
        logl = 0.0
        for x, y in zip(xs, ys):
            p = participate_proba * safe_sigmoid(discrimination * (x - difficulty))
            logl += safe_log(p if y == 1.0 else (1 - p))
        iterations.append((logl, difficulty, discrimination, retreat_proba))
    return max(iterations)[1:4]


def evaluate_2plm_irt(xs, ys, difficulty, discrimination):
    n = len(xs)
    if difficulty is None or discrimination is None:
        logl = n * math.log(0.5)
    else:
        logl = 0
        for x, y in zip(xs, ys):
            p = safe_sigmoid(discrimination * (x - difficulty))
            logl += safe_log(p if y == 1.0 else (1 - p))
    return logl, n


def evaluate_3plm_irt(xs, ys, difficulty, discrimination, retreateds):
    actual_xs, actual_ys = [], []
    for x, y, retreated in zip(xs, ys, retreateds):
        if not retreated:
            actual_xs.append(x)
            actual_ys.append(y)
    return evaluate_2plm_irt(actual_xs, actual_ys, difficulty, discrimination)


def inverse_adjust_rating(rating, prev_contests):
    if rating <= 0:
        return float("nan")
    if rating <= 400:
        rating = 400 * (1 - math.log(400 / rating))
    adjustment = (
        (math.sqrt(1 - (0.9 ** (2 * prev_contests))) / (1 - 0.9 ** prev_contests) - 1)
        / (math.sqrt(19) - 1)
        * 1200
    )
    return rating + adjustment


def is_very_easy_problem(task_screen_name):
    return (
        task_screen_name.startswith("abc")
        and task_screen_name[-1] in {"a", "b"}
        and int(task_screen_name[3:6]) >= 42
    )


def is_agc_easiest_problem(task_screen_name):
    return task_screen_name.startswith("agc") and task_screen_name.endswith("_a")


def fit_problem_model(user_results, task_screen_name):
    max_score = max(
        task_result[task_screen_name + ".score"] for task_result in user_results
    )
    if max_score == 0.0:
        print(
            f"The problem {task_screen_name} is not solved by any competitors. skipping."
        )
        return {}
    for task_result in user_results:
        task_result[task_screen_name + ".ac"] *= float(
            task_result[task_screen_name + ".score"] == max_score
        )
    elapsed = [
        task_result[task_screen_name + ".elapsed"] for task_result in user_results
    ]
    first_ac = min(elapsed)

    recurring_users = [
        task_result
        for task_result in user_results
        if task_result["prev_contests"] > 0 and task_result["rating"] > 0
    ]
    for task_result in recurring_users:
        task_result["raw_rating"] = inverse_adjust_rating(
            task_result["rating"], task_result["prev_contests"]
        )
    time_model_sample_users = [
        task_result
        for task_result in recurring_users
        if task_result[task_screen_name + ".time"] > first_ac / 2
        and task_result[task_screen_name + ".ac"] == 1.0
    ]
    model = {}
    if len(time_model_sample_users) < 40:
        print(
            f"{task_screen_name}: insufficient data ({len(time_model_sample_users)} users). skip estimating time model."
        )
    else:
        raw_ratings = [
            task_result["raw_rating"] for task_result in time_model_sample_users
        ]
        time_secs = [
            task_result[task_screen_name + ".time"] / (10 ** 9)
            for task_result in time_model_sample_users
        ]
        time_logs = [math.log(t) for t in time_secs]
        slope, intercept = single_regression(raw_ratings, time_logs)
        print(
            f"{task_screen_name}: time [sec] = exp({slope} * raw_rating + {intercept})"
        )
        if slope > 0:
            print("slope is positive. ignoring unreliable estimation.")
        else:
            model["slope"] = slope
            model["intercept"] = intercept
            model["variance"] = statistics.variance(
                [
                    slope * rating + intercept - time_log
                    for rating, time_log in zip(raw_ratings, time_logs)
                ]
            )

    if is_very_easy_problem(task_screen_name):
        # ad-hoc. excluding high-rating competitors from abc-a/abc-b dataset. They often skip these problems.
        difficulty_dataset = [
            task_result
            for task_result in recurring_users
            if task_result["is_rated"] and not task_result["retreated"]
        ]
    elif is_agc_easiest_problem(task_screen_name):
        # ad-hoc. AGC-A usually have missing data for negative samples.
        difficulty_dataset = recurring_users
    else:
        # normal. using all participants with at least one submissions
        difficulty_dataset = [
            task_result
            for task_result in recurring_users
            if not task_result["retreated"]
        ]
    if len(difficulty_dataset) < 40:
        print(
            f"{task_screen_name}: insufficient data ({len(difficulty_dataset)} users). skip estimating difficulty model."
        )
    elif all(
        task_result[task_screen_name + ".ac"] for task_result in difficulty_dataset
    ):
        print("all contestants got AC. skip estimating difficulty model.")
    elif not any(
        task_result[task_screen_name + ".ac"] for task_result in difficulty_dataset
    ):
        print("no contestants got AC. skip estimating difficulty model.")
    else:
        d_raw_ratings = [
            task_result["raw_rating"] for task_result in difficulty_dataset
        ]
        d_accepteds = [
            task_result[task_screen_name + ".ac"] for task_result in difficulty_dataset
        ]
        if is_agc_easiest_problem(task_screen_name):
            difficulty, discrimination, retreat_proba = fit_3plm_irt(
                d_raw_ratings, d_accepteds
            )
        else:
            difficulty, discrimination = fit_2plm_irt(d_raw_ratings, d_accepteds)
        print(f"difficulty: {difficulty}, discrimination: {discrimination}")
        if discrimination < 0:
            print("discrimination is negative. ignoring unreliable estimation.")
        elif difficulty > 6000:
            print("extreme difficulty. rejecting this estimation.")
        else:
            model["difficulty"] = difficulty
            model["discrimination"] = discrimination
        if is_agc_easiest_problem(task_screen_name):
            # evaluate difficulty and discrimination using 2plm data.
            d_retreateds = [
                task_result["retreated"] for task_result in difficulty_dataset
            ]
            loglikelihood, users = evaluate_3plm_irt(
                d_raw_ratings, d_accepteds, difficulty, discrimination, d_retreateds
            )
        else:
            loglikelihood, users = evaluate_2plm_irt(
                d_raw_ratings, d_accepteds, difficulty, discrimination
            )
        model["irt_loglikelihood"] = loglikelihood
        model["irt_users"] = users
    return model


def fetch_dataset_for_contest(
    contest_name, contest_type, existing_problem, session, skip_if_no_user_has_rating
):
    try:
        results = session.get(
            "https://atcoder.jp/contests/{}/standings/json".format(contest_name)
        ).json()
    except json.JSONDecodeError as e:
        print(f"{e}")
        return {}, []
    task_names = {
        task["TaskScreenName"]: task["TaskName"] for task in results["TaskInfo"]
    }

    user_results = []
    standings_data = results["StandingsData"]
    standings_data.sort(key=lambda result_row: result_row["Rank"])
    standings = []
    for result_row in standings_data:
        total_submissions = result_row["TotalResult"]["Count"]
        retreated = total_submissions == 0

        is_rated = result_row["IsRated"]
        rating = result_row["OldRating"]
        prev_contests = result_row["Competitions"]
        user_name = result_row["UserScreenName"]

        if not retreated and (is_rated or not contest_type.is_rated):
            standings.append(user_name)
        user_row = {
            "is_rated": is_rated,
            "rating": rating,
            "prev_contests": prev_contests,
            "user_name": user_name,
            "retreated": retreated,
        }
        for task_name in task_names:
            user_row[task_name + ".score"] = 0.0
            user_row[task_name + ".time"] = -1.0
            user_row[task_name + ".elapsed"] = 10 ** 200
            user_row[task_name + ".ac"] = 0.0

        prev_accepted_times = [0] + [
            task_result["Elapsed"]
            for task_result in result_row["TaskResults"].values()
            if task_result["Score"] > 0
        ]
        user_row["last_ac"] = max(prev_accepted_times)
        for task_screen_name, task_result in result_row["TaskResults"].items():
            user_row[task_screen_name + ".score"] = task_result["Score"]
            if task_result["Score"] > 0:
                elapsed = task_result["Elapsed"]
                penalty = task_result["Penalty"] * 5 * 60 * (10 ** 9)
                user_row[task_screen_name + ".elapsed"] = elapsed
                user_row[task_screen_name + ".time"] = (
                    penalty
                    + elapsed
                    - max(t for t in prev_accepted_times if t < elapsed)
                )
                user_row[task_screen_name + ".ac"] = float(task_result["Status"] == 1)
        user_results.append(user_row)

    if len(user_results) == 0 or (
        all(user_row["rating"] == 0 for user_row in user_results)
        and skip_if_no_user_has_rating
    ):
        print(
            f"There are no participants/submissions for contest {contest_name}. Ignoring."
        )
        return {}, standings

    user_results_by_problem = defaultdict(list)
    for task_screen_name in task_names.keys():
        if task_screen_name in existing_problem:
            print(f"The problem model for {task_screen_name} already exists. skipping.")
            continue
        user_results_by_problem[task_screen_name] += user_results
    return user_results_by_problem, standings


def get_current_models():
    try:
        return requests.get(
            "https://kenkoooo.com/atcoder/resources/problem-models.json"
        ).json()
    except Exception as e:
        print(f"Failed to fetch existing models.\n{e}")
        return {}


def infer_contest_type(contest) -> ContestType:
    if (
        contest["rate_change"] == "All"
        or contest["rate_change"] == "1200 ~ "
        or contest["rate_change"] == "2000 ~ "
    ):
        return ContestType.AGC
    elif contest["rate_change"] == " ~ 2799" or contest["rate_change"] == "1200 ~ 2799":
        return ContestType.NEW_ARC
    elif contest["rate_change"] == " ~ 1999":
        return ContestType.NEW_ABC
    elif contest["rate_change"] == " ~ 1199":
        return ContestType.OLD_ABC
    # rate_change == "-"
    elif contest["id"].startswith("arc"):
        return ContestType.OLD_UNRATED_ARC
    elif contest["id"].startswith("abc"):
        return ContestType.OLD_UNRATED_ABC
    elif contest["id"] in old_sponsored_contests:
        return ContestType.OLD_UNRATED_ARC
    else:
        return ContestType.UNRATED


def all_rated_contests():
    # Gets all contest IDs and their contest type
    # The result is ordered by the start time.
    contests = requests.get(
        "https://kenkoooo.com/atcoder/resources/contests.json"
    ).json()
    contests.sort(key=lambda contest: contest["start_epoch_second"])
    contests_and_types = [
        (contest["id"], infer_contest_type(contest)) for contest in contests
    ]
    return [
        (contest_id, contest_type)
        for contest_id, contest_type in contests_and_types
        if contest_type != ContestType.UNRATED
    ]


def all_contest_problems():
    problems = requests.get(
        "https://kenkoooo.com/atcoder/resources/problems.json"
    ).json()
    # exclude marathon-like problems
    problems = [
        problem for problem in problems if problem["id"] not in prohibited_problem_ids
    ]
    return {
        contest_id: set(problem["id"] for problem in problems)
        for contest_id, problems in itertools.groupby(
            problems, key=lambda problem: problem["contest_id"]
        )
    }


def run(target, overwrite, session):
    recompute_history = target is None and overwrite
    if target is None:
        target = all_rated_contests()
    else:
        all_contests = all_rated_contests()
        target = [contest for contest in all_contests if contest[0] in target]
    current_models = get_current_models()
    existing_problems = current_models.keys() if not overwrite else set()
    contest_problems = all_contest_problems()

    print(f"Fetching dataset from {len(target)} contests.")
    dataset_by_problem = defaultdict(list)
    rating_system = RatingSystem()
    competition_history_by_id = defaultdict(set)
    last_nonzero_rating = defaultdict(int)
    experimental_problems = set()
    for contest, contest_type in target:
        problems = set(contest_problems.get(contest, []))
        if not overwrite and existing_problems & problems == problems:
            print(
                "All problem models of contest {} are already estimated. specify overwrite = True if you want to update the model.".format(
                    contest
                )
            )
            continue
        is_old_contest = not contest_type.is_rated
        user_results_by_problem, standings = fetch_dataset_for_contest(
            contest, contest_type, existing_problems, session, not recompute_history
        )
        for problem, data_points in user_results_by_problem.items():
            if recompute_history:
                # overwrite competition history, and rating if necessary
                if is_old_contest:
                    # contests before official rating system. using the emulated rating
                    experimental_problems.add(problem)
                    for data_point in data_points:
                        prev_contests = rating_system.competition_count(
                            data_point["user_name"]
                        )
                        data_point["prev_contests"] = prev_contests
                        data_point["rating"] = (
                            rating_system.calc_rating(data_point["user_name"])
                            if prev_contests > 0
                            else 0
                        )
                else:
                    # contests after official rating system. using the official rating
                    if contest_type.is_rated:
                        for participant in standings:
                            competition_history_by_id[participant].add(contest)
                    for data_point in data_points:
                        user_name = data_point["user_name"]
                        if data_point["rating"] == 0:
                            # AtCoder returns 0 for OldRating if the user has no submission in the contest.
                            # It is not ideal when these users is also a part of dataset (e.g. AGC-A workaround)
                            data_point["rating"] = last_nonzero_rating.get(user_name, 0)
                        else:
                            last_nonzero_rating[user_name] = data_point["rating"]
                        data_point["prev_contests"] = (
                            len(competition_history_by_id[user_name]) - 1
                        )
            dataset_by_problem[problem] += data_points
        if recompute_history and is_old_contest:
            print("Updating user rating with the result of {}".format(contest))
            rating_system.update(standings, contest_type)
    print(f"Estimating time models of {len(dataset_by_problem)} problems.")
    results = current_models
    for problem, data_points in dataset_by_problem.items():
        model = fit_problem_model(data_points, problem)
        model["is_experimental"] = problem in experimental_problems
        results[problem] = model
    return results


def login(user_id, password):
    session = requests.Session()
    get_response = session.get("https://atcoder.jp/login")
    extractor = AtCoderCSRFExtractor()
    csrf = extractor.extract(get_response.text)
    form_values = {"username": user_id, "password": password, "csrf_token": csrf}
    post_response = session.post("https://atcoder.jp/login", data=form_values)
    if post_response.status_code != 200:
        raise Exception(str(post_response))
    return session


def handler(event, context):
    target = event.get("target")
    overwrite = event.get("overwrite", False)
    bucket = event.get("bucket", "kenkoooo.com")
    object_key = event.get("object_key", "resources/problem-models.json")
    atcoder_user = event.get("atcoder_user")
    atcoder_pass = event.get("atcoder_pass")

    if atcoder_user is None or atcoder_pass is None:
        raise ValueError("AtCoder credential is required.")
    print("Using AtCoder account {} to fetch standings data.".format(atcoder_user))

    session = login(atcoder_user, atcoder_pass)
    results = run(target, overwrite, session)
    print("Estimation completed. Saving results in S3")
    s3 = boto3.resource("s3")
    s3.Object(bucket, object_key).put(
        Body=json.dumps(results), ContentType="application/json"
    )
