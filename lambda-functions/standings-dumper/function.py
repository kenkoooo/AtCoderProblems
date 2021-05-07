import json
import re
from html.parser import HTMLParser

import boto3
import requests


STANDINGS_DIR = "resources/standings/"


def all_contests_id():
    # Gets all contest IDs
    # The result is ordered by the start time.
    contests = requests.get(
        "https://kenkoooo.com/atcoder/resources/contests.json"
    ).json()
    contests.sort(key=lambda contest: contest["start_epoch_second"])
    return [contest["id"] for contest in contests]


def fetch_standings(contest_id, session):
    try:
        response = session.get(
            "https://atcoder.jp/contests/{}/standings/json".format(contest_id)
        )
        # ex: kupc2020 has team standings only.
        if response.status_code != 200:
            response = session.get(
                "https://atcoder.jp/contests/{}/standings/team/json".format(contest_id)
            )
            if response.status_code != 200:
                print(f"Failed fetch from {contest_id}")
                return []
        results = response.json()
    except json.JSONDecodeError as e:
        print(f"Failed to decode standings of {contest_id}")
        print(f"{e}")
        return []
    return results


def get_already_fetched_contests(bucket, object_dir):
    try:
        keys = [obj.key for obj in bucket.objects.all() if obj.key.starts_with(object_dir)]
        contests = [key.replace(".json", "") for key in keys]
    except Exception as e:
        print(f"Failed to fetch.\n{e}")
        return []
    return contests


def run(target, already_fetched_contests, overwrite, session):
    if target is None:
        target = all_contests_id()
    else:
        all_contests = all_contests_id()
        target = [contest for contest in all_contests if contest in target]

    for contest_id in target:
        if not overwrite and contest_id in already_fetched_contests:
            print(
                f"Participants of contest {contest_id} are already dumped. specify overwrite = True if you want to update the participants."
            )
            continue
        standings = fetch_standings(contest_id, session)
        yield contest_id, standings


# TODO: This function can be shared with time-estimator/function.py
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


# TODO: This function can be shared with time-estimator/function.py
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
    object_dir = event.get("object_dir", STANDINGS_DIR)
    atcoder_user = event.get("atcoder_user")
    atcoder_pass = event.get("atcoder_pass")

    if atcoder_user is None or atcoder_pass is None:
        raise ValueError("AtCoder credential is required.")
    print("Using AtCoder account {} to fetch standings data.".format(atcoder_user))

    s3 = boto3.resource("s3")
    already_fetched_contests = get_already_fetched_contests(s3.Bucket(bucket), object_dir)

    session = login(atcoder_user, atcoder_pass)
    results = run(target, already_fetched_contests, overwrite, session)
    for contest_id, result in results:
        object_key = object_dir + contest_id + ".json"
        s3.Object(bucket, object_key).put(
            Body=json.dumps(result), ContentType="application/json"
        )
