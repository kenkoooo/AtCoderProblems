import json
from pathlib import Path

from function import run, login

if __name__ == '__main__':
    session = login(None, None)  # set your credential before use. Do not commit it!
    results = run(None, [], False, session)
    object_dir = "standings/"
    for contest_id, result in results:
        object_key = object_dir + contest_id + ".json"
        with Path(object_key).open("w") as f:
            json.dump(result, f, indent=4)
