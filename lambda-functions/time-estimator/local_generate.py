import json
from pathlib import Path
from shutil import move

from function import run, login

if __name__ == '__main__':
    if not Path("problem-models-old.json").exists() and Path("problem-models.json").exists():
        move("problem-models.json", "problem-models-old.json")
    session = login(None, None)  # set your credential before use. Do not commit it!
    results = run(None, True, session)
    with open("problem-models.json", "w") as f:
        json.dump(results, f)
