# -*- encoding:utf8 -*-
import argparse
import json
import logging
import os
import time
from datetime import datetime

import numpy

import ServerTools
from AtCoderSql import *

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
    rows = get_submissions(connection)

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
        update_honor(connection, {
            "shortest": honor["shortest"],
            "fastest": honor["fastest"],
            "first": honor["first"],
            "problem_id": problem_id
        })


def update_ac_ranking(connection):
    connection.execute("TRUNCATE TABLE ac_ranking", ())

    select = "SELECT COUNT(DISTINCT(problem_id)) AS count, user_name FROM submissions WHERE status='AC' GROUP BY user_name"
    rows = connection.execute(select, ())
    query = "INSERT INTO ac_ranking (user_name,count) VALUES "
    for row in rows:
        user_name = row["user_name"]
        count = row["count"]
        query += "('{}',{}),".format(user_name, count)
    query = query[:-1]
    connection.execute(query, ())


def data_updater_main(user, password):
    while True:
        start = time.time()
        try:
            connection = AtCoderSql(user, password)
            update_ac_ranking(connection)
            update_honorable_submissions(connection)
            print(time.time() - start)

        except Exception as e:
            print(e)

        time.sleep(600)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p

    data_updater_main(sql_user, sql_password)
