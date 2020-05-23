import json
from typing import List
import requests


def main(problem_ids: List[str]):
    problem_models = requests.get("https://kenkoooo.com/atcoder/resources/problem-models.json").json()
    print(f"removing {len(problem_ids)} models")
    for problem_id in problem_ids:
        model = problem_models.pop(problem_id, None)
        if model is None:
            print(f"{problem_id} not found.")
        else:
            print(f"{problem_id} is removed")
    with open("problem-models.json", "w") as f:
        json.dump(problem_models, f)


if __name__ == '__main__':
    from argparse import ArgumentParser
    parser = ArgumentParser()
    parser.add_argument("problem_ids", nargs="*")
    args = parser.parse_args()
    main(**vars(args))