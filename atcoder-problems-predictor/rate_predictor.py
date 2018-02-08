import urllib.request
import json
from typing import List, Tuple, Dict

import pandas as pd
import psycopg2
import numpy as np
import xgboost as xgb
import sys
from bs4 import BeautifulSoup
from sklearn.model_selection import train_test_split

COLUMN_RATING = "Rating"
COLUMN_PREDICT = "Predict"


def get_submissions(users: List[str], conn, table_name: str) -> List[Tuple[str, str, str, int]]:
    with conn.cursor() as cursor:
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
            a.problem_count
        FROM submissions AS s
        LEFT JOIN {} AS t ON s.user_id=t.user_id
        LEFT JOIN accepted_count AS a ON a.user_id=s.user_id
        WHERE t.user_id IS NOT NULL
        """.format(table_name)

    with conn.cursor() as cursor:
        cursor.execute(query)
        submissions = cursor.fetchall()
    return submissions


def insert_to_df(df: pd.DataFrame, submissions: List[Tuple[str, str, str, int]]):
    ac_set = set()
    wa_set = set()
    for problem_id, user_id, result, count in submissions:
        if result == "AC":
            ac_set.add((user_id, problem_id))
        else:
            wa_set.add((user_id, problem_id))
        df[user_id, "accepted_count"] = count
    print("AC Set:", len(ac_set))
    print("WA Set:", len(wa_set))
    for user_id, problem_id in wa_set:
        df.at[user_id, problem_id] = -1
    for user_id, problem_id in ac_set:
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

            users.append((user_id, current))
            min_count = min(min_count, match_count)
        if min_count < 15:
            break
    return users


def main(filepath: str):
    with open(filepath) as f:
        config = json.load(f)
    conn = psycopg2.connect(config["db"])

    model = xgb.XGBRegressor()
    problem_set = set()

    def train_model():
        # scrape user rating data
        users = scrape_rating()

        # generate train data
        submissions = get_submissions([u[0] for u in users], conn, "tmp_submissions")
        user_set = set([s[1] for s in submissions])
        for s in submissions:
            problem_set.add(s[0])
        df = pd.DataFrame(columns=problem_set, index=user_set)
        insert_to_df(df, submissions)
        df[COLUMN_RATING] = pd.Series(dict(users))

        # train
        train, test = train_test_split(df, test_size=0.2)
        x_train = train.iloc[:, :-1].values
        x_test = test.iloc[:, :-1].values
        y_train = train.loc[:, COLUMN_RATING].values
        model.fit(x_train, y_train)

        # test
        y_test_predict = model.predict(x_test)
        test[COLUMN_PREDICT] = y_test_predict
        rating = test.loc[:, COLUMN_RATING]
        test_predict = test.loc[:, COLUMN_PREDICT]
        rms = np.sqrt(((rating - test_predict) ** 2).mean())
        print("RMS:", rms)

    def predict() -> Dict[str, float]:
        # generate prediction data
        query = """
        SELECT
        max(id) as id, user_id
        FROM submissions
        WHERE result='AC'
        GROUP BY user_id
        ORDER BY id DESC
        LIMIT 3000
        """
        with conn.cursor() as cursor:
            cursor.execute(query)
            user_id_list: List[str] = [r[1] for r in cursor.fetchall()]

        print("User:", len(user_id_list))

        user_submissions = get_submissions(user_id_list, conn, "tmp_user_submissions")
        user_submissions = [s for s in user_submissions if s[0] in problem_set]
        print("Submission size:", len(user_submissions))

        user_df = pd.DataFrame(columns=problem_set, index=user_id_list)
        insert_to_df(user_df, user_submissions)

        # predict
        x_test = user_df.values
        y_test_predict = model.predict(x_test)
        user_df[COLUMN_PREDICT] = y_test_predict
        print(user_df.loc[:, [COLUMN_PREDICT]])
        return user_df[COLUMN_PREDICT].to_dict()

    def insert_to_db(result: Dict[str, float]):
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM predicted_rating")
            for user_id, rate in result.items():
                query = """
                INSERT INTO predicted_rating (user_id, rating)
                VALUES (%s, %s)
                """
                cursor.execute(query, (user_id, rate))
                conn.commit()

    train_model()
    predicted_result = predict()
    insert_to_db(predicted_result)


if __name__ == '__main__':
    main(sys.argv[1])
