import urllib.request
import json
import pandas as pd
import psycopg2
import numpy as np
import xgboost as xgb
import sys
from bs4 import BeautifulSoup
from sklearn.model_selection import train_test_split


def get_submissions(users, conn):
    user_string = ",".join(["'" + u + "'" for u in users])
    query = "SELECT s.problem_id, s.user_id, s.result FROM submissions AS s WHERE s.user_id in ({})".format(user_string)

    with conn.cursor() as cursor:
        cursor.execute(query)
        submissions = cursor.fetchall()
    return submissions


def main(filepath: str):
    with open(filepath) as f:
        config = json.load(f)
    conn = psycopg2.connect(config["db"])
    # scrape user rating data
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

    submissions = get_submissions([u[0] for u in users], conn)

    user_set = set([s[1] for s in submissions])
    problem_set = set([s[0] for s in submissions])
    ac_set = set()
    wa_set = set()
    for problem_id, user_id, result in submissions:
        if result == "AC":
            ac_set.add((user_id, problem_id))
        else:
            wa_set.add((user_id, problem_id))

    df = pd.DataFrame(columns=problem_set, index=user_set)
    for user_id, problem_id in wa_set:
        df.at[user_id, problem_id] = -1
    for user_id, problem_id in ac_set:
        df.at[user_id, problem_id] = 1
    df["Rating"] = pd.Series(dict(users))

    # learn
    train, test = train_test_split(df, test_size=0.2)
    x_train = train.iloc[:, :-1].values
    x_test = test.iloc[:, :-1].values
    y_train = train.loc[:, "Rating"].values
    model = xgb.XGBRegressor()
    model.fit(x_train, y_train)
    y_test_predict = model.predict(x_test)
    test["Predict"] = y_test_predict
    rating = test.loc[:, "Rating"]
    predict = test.loc[:, "Predict"]
    print("RMS: ", np.sqrt(((rating - predict) ** 2).mean()))

    # predict
    user_submissions = get_submissions(["eha", "kenkoooo", "shiratty8"], conn)
    ac_set = set()
    wa_set = set()
    for problem_id, user_id, result in user_submissions:
        if result == "AC":
            ac_set.add((user_id, problem_id))
        else:
            wa_set.add((user_id, problem_id))
    user_df = pd.DataFrame(columns=df.columns.values, index=[])
    for user_id, problem_id in wa_set:
        user_df.at[user_id, problem_id] = -1
    for user_id, problem_id in ac_set:
        user_df.at[user_id, problem_id] = 1
    x_test = user_df.iloc[:, :-1].values
    y_test_predict = model.predict(x_test)
    user_df["Predict"] = y_test_predict
    print(user_df.loc[:, ["Predict"]])


if __name__ == '__main__':
    main(sys.argv[1])
