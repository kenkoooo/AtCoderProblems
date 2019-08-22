import re

import requests
import json

ATCODER_API_PATTERN = re.compile(r"^users/.+/history/json$")


def handler(event, context):
    print(json.dumps(event))
    path = event["pathParameters"]["proxy"]
    if not ATCODER_API_PATTERN.match(path):
        return "The path requested is not supported."
    resp = requests.get(f"https://atcoder.jp/{path}").json()
    return {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(resp)
    }
