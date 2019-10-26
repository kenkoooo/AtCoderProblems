import json
from pathlib import Path
from shutil import move

from function import run

if __name__ == '__main__':
    if not Path("problem-models-old.json").exists() and Path("problem-models.json").exists():
        move("problem-models.json", "problem-models-old.json")
    results = run(None, True)
    with open("problem-models.json", "w") as f:
        json.dump(results, f)
