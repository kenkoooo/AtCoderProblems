# -*- encoding:utf8 -*-
import argparse
import json

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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p

    conn = ServerTools.connect_my_sql(sql_user, sql_password)
    update_solver_num(conn)

    generate_contests(conn)
    generate_problems(conn)
    generate_problems_simple(conn)
    conn.close()
