import argparse
from datetime import datetime

import CrawlTools
import ServerTools


def update_results(connection):
    contest_set = set(CrawlTools.get_contest_list())
    with connection.cursor() as cursor:
        query = "SELECT DISTINCT(contest) AS contest FROM results"
        cursor.execute(query)
        rows = cursor.fetchall()
        contest_set -= set([row["contest"] for row in rows])
        for contest in contest_set:
            results = CrawlTools.get_results(contest)
            if len(results) == 0:
                continue
            for result in results:
                query = "INSERT INTO results(contest,user,rank) VALUES (%s,%s,%s)"
                cursor.execute(query, (contest, result[0], result[1]))
                connection.commit()


def update_submissions(connection):
    with connection.cursor() as cursor:
        query = "SELECT id FROM contests ORDER BY last_crawled ASC LIMIT 1"
        cursor.execute(query)
        rows = cursor.fetchall()
        contest = rows[0]["id"]

    with connection.cursor() as cursor:
        query = "SELECT id FROM submissions WHERE contest_id=%s ORDER BY id DESC LIMIT 1"
        cursor.execute(query, (contest))
        rows = cursor.fetchall()
        if len(rows) == 0:
            latest_id = 0
        else:
            latest_id = rows[0]["id"]

    i = 1
    max_page = 1
    while i <= max_page:
        submissions, max_page = CrawlTools.get_submissions(contest, i)
        if len(submissions) == 0:
            break
        for submission in submissions:
            if submission["id"] <= latest_id:
                max_page = 0
                break
            with connection.cursor() as cursor:
                query = "INSERT INTO submissions"
                query += "(id,problem_id,contest_id,user_name,status,source_length,language,exec_time,created_time)" \
                         " VALUES (%(id)s,%(problem_id)s,%(contest_id)s,%(user_name)s,%(status)s,%(source_length)s," \
                         "%(language)s,%(exec_time)s,%(created_time)s)"
                cursor.execute(query, {
                    "id": submission["id"],
                    "problem_id": submission["problem_id"],
                    "contest_id": contest,
                    "user_name": submission["user_name"],
                    "status": submission["status"],
                    "source_length": submission["source_length"],
                    "language": submission["language"],
                    "exec_time": submission["exec_time"],
                    "created_time": submission["created_time"]
                })
                connection.commit()
                print(submission["id"])
        i += 1
    with connection.cursor() as cursor:
        query = "UPDATE contests SET last_crawled=%s WHERE id=%s"
        cursor.execute(query, (datetime.now().strftime("%Y/%m/%d %H:%M:%S"), contest))
        connection.commit()


def update_contests(connection):
    pass


def update_problems(connection):
    pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p

    conn = ServerTools.connect_my_sql(sql_user, sql_password)
    # update_results(conn)
    update_submissions(conn)
    conn.close()
