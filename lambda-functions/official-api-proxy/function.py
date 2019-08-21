import re

import requests


ATCODER_API_PATTERN = re.compile(r"^users/.+/history/json$")


def handler(event, context):
    path = event.get("path")
    if not ATCODER_API_PATTERN.match(path):
        return "The path requested is not supported."
    resp = requests.get(f"https://atcoder.jp/{path}").json()
    return resp


if __name__ == '__main__':
    event = {
        "path": "users/amylase/history/json"
    }
    print(handler(event, None))