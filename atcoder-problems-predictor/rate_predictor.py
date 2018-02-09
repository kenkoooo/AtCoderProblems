import json
import sys
import urllib.request
from typing import List, Tuple, Dict, Set

import numpy as np
import pandas as pd
import psycopg2
import xgboost as xgb
from bs4 import BeautifulSoup
from sklearn.externals import joblib
from sklearn.model_selection import KFold

COLUMN_RATING = "Rating"
COLUMN_PREDICT = "Predict"
PROBLEM_SET_JSON_NAME = "./problem_set.json"
MODEL_DUMP_NAME = "./save_xgb_predicted_rating"
TMP_DATABASE = "tmp_submissions"
ITER_WIDTH = 3000
BLACK_LIST = {"KokiYmgch"}


def get_submissions(users: List[str], conn, table_name: str) -> List[Tuple[str, str, str, int, float]]:
    with conn.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS {}".format(table_name))
        conn.commit()
        cursor.execute(
            "CREATE TEMPORARY TABLE {} (user_id VARCHAR(255) NOT NULL, PRIMARY KEY (user_id))".format(table_name))
        conn.commit()
        cursor.executemany("INSERT INTO {} (user_id) VALUES (%s)".format(table_name), [(x,) for x in users])
        conn.commit()

    query = """
        SELECT
            s.problem_id,
            s.user_id,
            s.result,
            a.problem_count,
            p.point
        FROM submissions AS s
        LEFT JOIN {} AS t ON s.user_id=t.user_id
        LEFT JOIN accepted_count AS a ON a.user_id=s.user_id
        LEFT JOIN points AS p ON p.problem_id=s.problem_id
        WHERE t.user_id IS NOT NULL
        """.format(table_name)

    with conn.cursor() as cursor:
        cursor.execute(query)
        submissions = cursor.fetchall()
    return submissions


def insert_to_df(df: pd.DataFrame, submissions: List[Tuple[str, str, str, int, float]]):
    ac_set = set()
    wa_set = set()
    count_dict = {}
    user_point_count: Dict[Tuple[str, float], int] = {}
    problem_point = {}
    for problem_id, user_id, result, count, point in submissions:
        if result == "AC":
            ac_set.add((user_id, problem_id))
            if point:
                problem_point[problem_id] = point

                num = user_point_count.get((user_id, point), 0)
                user_point_count[(user_id, point)] = num + 1
        else:
            wa_set.add((user_id, problem_id))
        count_dict[user_id] = count
    df["accepted_count"] = pd.Series(count_dict)
    print("AC Set:", len(ac_set))
    print("WA Set:", len(wa_set))
    for user_id, problem_id in wa_set:
        df.at[user_id, problem_id] = -1
    for user_id, problem_id in ac_set:
        df.at[user_id, problem_id] = 1

    user_max_point: Dict[str, float] = {}
    for (user_id, point), count in user_point_count.items():
        if count >= 3:
            current = user_max_point.get(user_id, 0)
            user_max_point[user_id] = max(current, point)

    for problem_id, point in problem_point.items():
        for user_id, max_point in user_max_point.items():
            if point < max_point:
                df.at[user_id, problem_id] = 1

    df.fillna(0, inplace=True)


def scrape_rating() -> List[Tuple[str, int]]:
    users = []
    min_count = 100
    for count in range(1, 30):
        url = "https://beta.atcoder.jp/ranking?desc=true&orderBy=competitions&page={}".format(count)
        print(url)
        html = urllib.request.urlopen(url)
        soup = BeautifulSoup(html, "lxml")
        for tr in soup.findAll("tbody")[0].findAll("tr"):
            tds = tr.findAll("td")
            user_id = tds[1].findAll("a")[1].text
            current = int(tds[3].text)
            match_count = int(tds[5].text)

            if user_id not in BLACK_LIST:
                users.append((user_id, current))
            min_count = min(min_count, match_count)
        if min_count < 15:
            break
    return users


def train_model(model, problem_set: Set[str], conn):
    # scrape user rating data
    users = scrape_rating()

    # generate train data
    submissions = get_submissions([u[0] for u in users], conn, TMP_DATABASE)
    user_set = set([s[1] for s in submissions])
    for s in submissions:
        problem_set.add(s[0])
    df = pd.DataFrame(columns=problem_set, index=user_set)
    insert_to_df(df, submissions)
    df[COLUMN_RATING] = pd.Series(dict(users))

    k_fold = KFold(n_splits=3)
    x = df.iloc[:, :-1].values
    y = df.loc[:, COLUMN_RATING].values
    for train, test in k_fold.split(x):
        x_train = x[train]
        x_test = x[test]
        y_train = y[train]
        model.fit(x_train, y_train)

        # test
        y_test_predict = model.predict(x_test)
        test_df = df.iloc[test, :]
        test_df[COLUMN_PREDICT] = y_test_predict
        rating = test_df.loc[:, COLUMN_RATING]
        test_predict = test_df.loc[:, COLUMN_PREDICT]
        rms = np.sqrt(((rating - test_predict) ** 2).mean())
        print("RMS:", rms)
        test_df["Rating-Predict"] = test_df[COLUMN_RATING] - test_df[COLUMN_PREDICT]
        print(test_df.loc[:, ["Rating-Predict", COLUMN_RATING, COLUMN_PREDICT]].sort_values(by=["Rating-Predict"]))
    model.fit(x, y)


def predict(model, problem_set: Set[str], conn) -> List[Dict[str, float]]:
    # generate prediction data
    query = """
    SELECT
    max(id) as id, user_id
    FROM submissions
    WHERE result='AC'
    GROUP BY user_id
    ORDER BY id DESC
    LIMIT 10000
    """
    with conn.cursor() as cursor:
        cursor.execute(query)
        queue_user_id: List[str] = [r[1] for r in cursor.fetchall()]

    res = []
    while len(queue_user_id) > 0:
        user_id_list, queue_user_id = queue_user_id[:ITER_WIDTH], queue_user_id[ITER_WIDTH:]
        print("User:", len(user_id_list))

        user_submissions = get_submissions(user_id_list, conn, TMP_DATABASE)
        user_submissions = [s for s in user_submissions if s[0] in problem_set]
        print("Submission size:", len(user_submissions))

        user_df = pd.DataFrame(columns=problem_set, index=user_id_list)
        insert_to_df(user_df, user_submissions)

        # predict
        x_test = user_df.values
        y_test_predict = model.predict(x_test)
        user_df[COLUMN_PREDICT] = y_test_predict
        print(user_df.loc[:, [COLUMN_PREDICT]])
        res.append(user_df[COLUMN_PREDICT].to_dict())
    return res


def main(filepath: str):
    with open(filepath) as f:
        config = json.load(f)
    conn = psycopg2.connect(config["db"])

    model = xgb.XGBRegressor()
    problem_set = set()
    train_model(model, problem_set, conn)
    model.get_booster().save_model(MODEL_DUMP_NAME)

    loaded_model = xgb.XGBRegressor()
    loaded_model.get_booster().load_model(MODEL_DUMP_NAME)

    predicted_result = predict(loaded_model, problem_set, conn)
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM predicted_rating")
        for result in predicted_result:
            for user_id, rate in result.items():
                query = """
                        INSERT INTO predicted_rating (user_id, rating)
                        VALUES (%s, %s)
                        """
                cursor.execute(query, (user_id, rate))
                conn.commit()


if __name__ == '__main__':
    main(sys.argv[1])
