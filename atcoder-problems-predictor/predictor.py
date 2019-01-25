import json

import pandas as pd
import psycopg2
import sys
import xgboost as xgb


def main(filepath: str):
    with open(filepath) as f:
        config = json.load(f)
    conn = psycopg2.connect(config["db"])
    query = """
    SELECT max(point) as max, problem_id FROM submissions AS s
    WHERE s.problem_id IN
    (
        SELECT problems.id FROM problems
        JOIN contests ON problems.contest_id=contests.id
        WHERE contests.start_epoch_second>=1468670400
        AND rate_change!='-'
    )
    GROUP BY s.problem_id
    ORDER BY max
    """
    with conn.cursor() as cursor:
        cursor.execute(query)
        for point, problem_id in cursor.fetchall():
            query = """
            INSERT INTO points (problem_id, point)
            VALUES (%s, %s)
            ON CONFLICT (problem_id) DO UPDATE
            SET point = %s;
            """
            cursor.execute(query, (problem_id, point, point))
            conn.commit()

    query = """
    SELECT 
    m.point,
    s.problem_id,
    s.user_id,
    s.result
    FROM submissions AS s
    LEFT JOIN points AS m ON s.problem_id=m.problem_id
    LEFT JOIN problems AS p ON p.id=m.problem_id
    LEFT JOIN contests AS c ON c.id=p.contest_id
    LEFT JOIN (
        SELECT COUNT(DISTINCT(problem_id)) AS count, user_id FROM submissions WHERE result='AC' GROUP BY user_id
    ) AS u ON u.user_id=s.user_id
    WHERE u.count>300
    """

    with conn.cursor() as cursor:
        cursor.execute(query)
        submissions = cursor.fetchall()
    user_set = set([s[2] for s in submissions])
    problem_set = set([s[1] for s in submissions])
    ac_set = set()
    wa_set = set()
    problems = {}
    for submission in submissions:
        point = submission[0]
        result = submission[3]
        problem_id = submission[1]
        user_id = submission[2]
        if result == "AC":
            ac_set.add((user_id, problem_id))
        else:
            wa_set.add((user_id, problem_id))
        problems[problem_id] = point

    df = pd.DataFrame(columns=user_set, index=problem_set)
    for user_id, problem_id in wa_set:
        df.at[problem_id, user_id] = -1
    for user_id, problem_id in ac_set:
        df.at[problem_id, user_id] = 1
    df["Point"] = pd.Series(problems)
    train = df[df.Point.notnull()]
    test = df[df.Point.isnull()]
    x_train = train.iloc[:, :-1].values
    x_test = test.iloc[:, :-1].values
    y_train = train.loc[:, "Point"].values
    model = xgb.XGBRegressor()
    model.fit(x_train, y_train)
    y_test_predict = model.predict(x_test)
    test["Predict"] = y_test_predict

    with conn.cursor() as cursor:
        for problem_id, point in test["Predict"].to_dict().items():
            query = """
            INSERT INTO points (problem_id, predict)
            VALUES (%s, %s)
            ON CONFLICT (problem_id) DO UPDATE
            SET predict = %s;
            """
            cursor.execute(query, (problem_id, point, point))
            conn.commit()


if __name__ == '__main__':
    main(sys.argv[1])
