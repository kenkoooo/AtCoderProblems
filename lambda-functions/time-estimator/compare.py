import json
import math


def calc_average_normalized_loglikelihood(models, keys=None) -> float:
    keys = keys or models.keys()
    accum_normalized_logloss = 0.
    for key in keys:
        if key not in models:
            accum_normalized_logloss += math.log(0.5)
            continue
        model = models[key]
        if "irt_loglikelihood" not in model or "irt_users" not in model:
            accum_normalized_logloss += math.log(0.5)
            continue
        accum_normalized_logloss += model["irt_loglikelihood"] / model["irt_users"]
    return accum_normalized_logloss / len(keys)


if __name__ == '__main__':
    with open("problem-models-old.json") as f:
        old_models = {key: model for key, model in json.load(f).items() if model.get("difficulty", None) is not None}
    with open("problem-models.json") as f:
        new_models = {key: model for key, model in json.load(f).items() if model.get("difficulty", None) is not None}
    only_old = old_models.keys() - new_models.keys()
    only_new = new_models.keys() - old_models.keys()

    print(f"only_old: {len(only_old)}")
    for problem_key in sorted(only_old):
        old_difficulty = old_models[problem_key]["difficulty"]
        print(f"{problem_key}: {old_difficulty:.02f} -> (not estimated)")

    print(f"only_new: {len(only_new)}")
    for problem_key in sorted(only_new):
        new_difficulty = new_models[problem_key]["difficulty"]
        print(f"{problem_key}: (not estimated) -> {new_difficulty:.02f}")

    print(f"common diffs")
    for problem_key in sorted(old_models.keys() & new_models.keys()):
        old_difficulty = old_models[problem_key]["difficulty"]
        new_difficulty = new_models[problem_key]["difficulty"]
        if abs(new_difficulty - old_difficulty) > 100 and old_difficulty > 0:
            print(f"{problem_key}: {old_difficulty:.02f} -> {new_difficulty:.02f} d = {new_difficulty - old_difficulty:-.02f}")

    print(f"likelihood")
    all_keys = old_models.keys() | new_models.keys()
    old_score = calc_average_normalized_loglikelihood(old_models, all_keys)
    new_score = calc_average_normalized_loglikelihood(new_models, all_keys)
    improvement = (new_score - old_score) / old_score
    print(f"{old_score:.03f} -> {new_score:.03f} ({improvement * 100:.03f}% improvement)")