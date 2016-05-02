# -*- encoding:utf8 -*-
import argparse
import io
import json
import sys

import pymysql.cursors

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
user = ""
password = ""
json_dir = "/usr/share/atcoder/json/"


def connect_my_sql():
    connection = pymysql.connect(
        host="localhost",
        user=user,
        password=password,
        db="atcoder",
        charset="utf8",
        cursorclass=pymysql.cursors.DictCursor)
    return connection


def generate_problems():
    connection = connect_my_sql()
    with connection.cursor() as cursor:
        query = "SELECT" + \
                " problems.id, problems.contest, problems.name, difficulty, solvers," + \
                " shortest.id AS shortest_id, shortest.contest_id AS shortest_contest, shortest.source_length, shortest.user_name AS shortest_user," + \
                " fastest.id AS fastest_id, fastest.contest_id AS fastest_contest, fastest.exec_time, fastest.user_name AS fastest_user," + \
                " first.id AS first_id, first.contest_id AS first_contest, first.user_name AS first_user" + \
                " FROM problems" + \
                " LEFT JOIN submissions AS shortest ON problems.shortest_submission_id=shortest.id" + \
                " LEFT JOIN submissions AS fastest ON problems.fastest_submission_id=fastest.id" + \
                " LEFT JOIN submissions AS first ON problems.first_submission_id=first.id"
        cursor.execute(query)
        rows = cursor.fetchall()
    connection.close()
    f = open(json_dir + "problems.json", mode="w", encoding="utf-8")
    json.dump(rows, f, ensure_ascii=False, separators=(',', ':'))
    f.close()


def generate_contests():
    connection = connect_my_sql()
    with connection.cursor() as cursor:
        query = "SELECT id, name, start, end FROM contests"
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            row["start"] = row["start"].isoformat(" ")
            row["end"] = row["end"].isoformat(" ")
    connection.close()
    f = open(json_dir + "contests.json", mode="w", encoding="utf-8")
    json.dump(rows, f, ensure_ascii=False, separators=(',', ':'))
    f.close()


def update_solver_num():
    connection = connect_my_sql()

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

    connection.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    user = args.u
    password = args.p

    generate_contests()
    generate_problems()
