import argparse
import logging
import os
import time
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
    update_contest_submissions(connection, contest)


def update_contest_submissions(connection, contest, only_diff=True):
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
            if submission["id"] <= latest_id and only_diff:
                max_page = 0
                break

            with connection.cursor() as cursor:
                if ServerTools.is_in_record(connection, "submissions", "id", submission["id"]):
                    continue
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
        i += 1
    with connection.cursor() as cursor:
        query = "UPDATE contests SET last_crawled=%s WHERE id=%s"
        cursor.execute(query, (datetime.now().strftime("%Y/%m/%d %H:%M:%S"), contest))
        connection.commit()
    logging.info(datetime.now().strftime("%Y/%m/%d %H:%M:%S") + ": Submission Crawled " + contest)


def update_contests(connection):
    contests = CrawlTools.get_contest_list()
    for contest in contests:
        if ServerTools.is_in_record(connection, "contests", "id", contest):
            continue
        problems, times, contest_name = CrawlTools.get_problem_set(contest)
        if len(problems) == 0:
            continue

        with connection.cursor() as cursor:
            for problem_id, problem_name in problems.items():
                if ServerTools.is_in_record(connection, "problems", "id", problem_id):
                    continue
                query = "INSERT INTO problems(id,contest,name)"
                query += " VALUES (%(id)s,%(contest)s,%(name)s)"
                cursor.execute(query, {"id": problem_id, "contest": contest, "name": problem_name})
                connection.commit()
            query = "INSERT INTO `contests`(`id`, `name`, `start`, `end`)"
            query += " VALUES (%(id)s,%(name)s,%(start)s,%(end)s)"
            cursor.execute(query, {
                "id": contest,
                "name": contest_name,
                "start": times["start"],
                "end": times["end"]
            })
            connection.commit()


def crawler_main(user, password):
    crawl_log_dir = "crawl_log/"
    if not os.path.exists(crawl_log_dir):
        os.makedirs(crawl_log_dir)

    i = 100000
    while True:
        logging.basicConfig(filename=crawl_log_dir + datetime.now().strftime("%Y-%m-%d") + ".log", level=logging.DEBUG)
        logging.info("i=" + str(i))
        try:
            conn = ServerTools.connect_my_sql(user, password)

            if i >= 3600 * 3:
                logging.info("Update Contests")
                # update_results(conn)
                update_contests(conn)
                i = 0
            else:
                logging.info("Update Submissions")
                update_submissions(conn)
                i += 1

            conn.close()

        except Exception as e:
            logging.error(datetime.now().strftime("%Y/%m/%d %H:%M:%S") + ": Submission Crawled " + e)
        time.sleep(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p
    crawler_main(sql_user, sql_password)
