import json
from shutil import move

from function import run, all_contests


if __name__ == '__main__':
    move("problem-models.json", "problem-models-old.json")
    results = run(all_contests(), True)
    with open("problem-models.json", "w") as f:
        json.dump(results, f)
