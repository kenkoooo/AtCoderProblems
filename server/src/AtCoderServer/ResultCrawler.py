import argparse

import time

from AtCoderSql import AtCoderSql, insert_results
import CrawlTools


def run(user, password):
    connection = AtCoderSql(user, password)

    while True:
        contest_set = set(
            [c["contest"] for c in connection.execute("SELECT DISTINCT(id) AS contest FROM contests", ())])
        rows = connection.execute("SELECT DISTINCT(contest) AS contest FROM results", ())
        contest_set -= set([row["contest"] for row in rows])

        for contest in contest_set:
            results = CrawlTools.get_result_json(contest)
            if len(results) == 0:
                continue
            results_list = []
            for i in range(0, len(results)):
                results_list.append({"user": results[i]["user_screen_name"], "rank": i + 1})
            insert_results(connection, contest, results_list)

            time.sleep(1)
        time.sleep(60 * 10)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p
    run(sql_user, sql_password)
