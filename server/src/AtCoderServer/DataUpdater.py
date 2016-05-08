# -*- encoding:utf8 -*-
import argparse
import json
import logging
import os
import time
from datetime import datetime
import numpy
import re

import ServerTools

json_dir = "/usr/share/atcoder/json/"


def generate_problems(connection):
    rows = ServerTools.get_all_submissions(connection)
    for row in rows:
        if row["contest"] == row["first_contest"]:
            row["first_contest"] = ""
        if row["contest"] == row["shortest_contest"]:
            row["shortest_contest"] = ""
        if row["contest"] == row["fastest_contest"]:
            row["fastest_contest"] = ""
    f = open(json_dir + "problems.json", mode="w", encoding="utf-8")
    json.dump(rows, f, ensure_ascii=False, separators=(',', ':'))
    f.close()


def generate_problems_simple(connection):
    rows = ServerTools.get_all_submissions(connection)
    simplified = []
    for row in rows:
        simplified.append({
            "contest": row["contest"],
            "name": row["name"],
            "id": row["id"],
        })
    f = open(json_dir + "problems_simple.json", mode="w", encoding="utf-8")
    json.dump(simplified, f, ensure_ascii=False, separators=(',', ':'))
    f.close()


def generate_contests(connection):
    with connection.cursor() as cursor:
        query = "SELECT id, name, start, end FROM contests"
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            row["start"] = row["start"].isoformat(" ")
            row["end"] = row["end"].isoformat(" ")
    f = open(json_dir + "contests.json", mode="w", encoding="utf-8")
    json.dump(rows, f, ensure_ascii=False, separators=(',', ':'))
    f.close()


def update_solver_num(connection):
    solver_map = {}
    with connection.cursor() as cursor:
        query = "SELECT COUNT(DISTINCT(user_name)) AS solvers, problem_id" + \
                " FROM submissions WHERE status='AC' GROUP BY problem_id"
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            solver_map[row["problem_id"]] = row["solvers"]

    with connection.cursor() as cursor:
        query = "SELECT id FROM problems"
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            problem_id = row["id"]
            if problem_id not in solver_map:
                continue
            query = "UPDATE problems SET solvers=%s WHERE id=%s"
            cursor.execute(query, (solver_map[problem_id], problem_id))
            connection.commit()


def update_honorable_submissions(connection):
    with connection.cursor() as cursor:
        query = "SELECT id,problem_id,source_length,exec_time FROM submissions WHERE status='AC'"
        cursor.execute(query)
        rows = cursor.fetchall()

    honorable_map = {}
    for row in rows:
        if row["problem_id"] not in honorable_map:
            honorable_map[row["problem_id"]] = {
                "shortest": row["id"],
                "fastest": row["id"],
                "first": row["id"],
                "source_length": row["source_length"],
                "exec_time": row["exec_time"]
            }
        if row["source_length"] < honorable_map[row["problem_id"]]["source_length"]:
            honorable_map[row["problem_id"]]["source_length"] = row["source_length"]
            honorable_map[row["problem_id"]]["shortest"] = row["id"]
        if row["exec_time"] < honorable_map[row["problem_id"]]["exec_time"]:
            honorable_map[row["problem_id"]]["exec_time"] = row["exec_time"]
            honorable_map[row["problem_id"]]["fastest"] = row["id"]

    for problem_id, honor in honorable_map.items():
        with connection.cursor() as cursor:
            query = "UPDATE problems SET " \
                    "shortest_submission_id=%(shortest)s," \
                    "fastest_submission_id=%(fastest)s," \
                    "first_submission_id=%(first)s" \
                    " WHERE id=%(problem_id)s"
            cursor.execute(query, {
                "shortest": honor["shortest"],
                "fastest": honor["fastest"],
                "first": honor["first"],
                "problem_id": problem_id
            })
            connection.commit()


def update_ac_ranking(connection):
    with connection.cursor() as cursor:
        query = "SELECT COUNT(DISTINCT(problem_id)) AS count, user_name FROM submissions WHERE status='AC' GROUP BY user_name ORDER BY count DESC"
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            query = "INSERT INTO ac_ranking (user_name,count) VALUES (%(user_name)s,%(count)s)" \
                    " ON DUPLICATE KEY UPDATE count=%(count)s"
            cursor.execute(query, row)
            connection.commit()


def update_difficulty(connection):
    tekito = 20

    with connection.cursor() as cursor:
        cursor.execute(
            "Select id, problem_id, contest_id, user_name FROM submissions WHERE status='AC'"
        )
        rows = cursor.fetchall()

    solvers_set = {}
    for row in rows:
        if row["problem_id"] not in solvers_set:
            solvers_set[row["problem_id"]] = set()
        solvers_set[row["problem_id"]].add(row["user_name"])

    user_points = {}
    for problem_id, solvers in solvers_set.items():
        solver_num = len(solvers)
        for user in solvers:
            if user not in user_points:
                user_points[user] = []
            user_points[user].append(solver_num)

    user_rating = {}
    for user_name, solved in user_points.items():
        solved = sorted(solved)
        if len(solved) < tekito:
            continue
        user_rating[user_name] = numpy.mean([solved[i] for i in range(0, tekito)])

    difficulties = []
    for problem_id, users in solvers_set.items():
        rating = []
        for user in users:
            if user in user_rating:
                rating.append(user_rating[user])
        rating.sort(reverse=True)
        if len(rating) == 0:
            continue

        difficulties.append((numpy.mean([rating[i] for i in range(0, min(tekito, len(rating)))]), problem_id))
    for difficulty, problem_id in sorted(difficulties):
        if re.match(r"^abc", problem_id):
            print(difficulty, problem_id)


def data_updater_main(user, password):
    updater_log_dir = "update_log/"
    if not os.path.exists(updater_log_dir):
        os.makedirs(updater_log_dir)

    while True:
        logging.basicConfig(filename=updater_log_dir + datetime.now().strftime("%Y-%m-%d") + ".log",
                            level=logging.DEBUG)
        try:
            conn = ServerTools.connect_my_sql(user, password)

            update_ac_ranking(conn)
            update_solver_num(conn)
            update_honorable_submissions(conn)

            generate_contests(conn)
            generate_problems(conn)
            generate_problems_simple(conn)

            conn.close()
            logging.info(datetime.now().strftime("%Y/%m/%d %H:%M:%S") + ": Updated")
        except Exception as e:
            logging.error(datetime.now().strftime("%Y/%m/%d %H:%M:%S") + ": Update Error " + e)

        time.sleep(600)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p

    data_updater_main(sql_user, sql_password)
