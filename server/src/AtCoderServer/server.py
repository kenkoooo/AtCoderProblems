# -*- encoding:utf8 -*-
import argparse
import json
import re

import pymysql.cursors
from bottle import get, run, response, request

user = ""
password = ""


def connect_my_sql():
    connection = pymysql.connect(
        host="localhost",
        user=user,
        password=password,
        db="atcoder",
        charset="utf8",
        cursorclass=pymysql.cursors.DictCursor)
    return connection


@get("/problems")
def problems():
    username = request.query.user.lower()
    if re.match(r"^[a-zA-Z0-9_\-]*$", username) is None:
        username = ""

    rivals = request.query.rivals.lower()
    if re.match(r"^[a-z0-9_\-,]*$", rivals):
        rivals = rivals.strip().split(",")
    else:
        rivals = []

    searcher = set(rivals)
    searcher.add(username)
    if "" in searcher:
        searcher.remove("")
    if len(searcher) == 0:
        return ""

    connection = connect_my_sql()
    resmap = {}
    with connection.cursor() as cursor:
        query = "SELECT status,problem_id,user_name,created_time FROM submissions WHERE user_name IN %s"
        cursor.execute(query, ((searcher),))
        rows = cursor.fetchall()
        for row in rows:
            problem_id = row["problem_id"]
            if problem_id not in resmap:
                resmap[problem_id] = {
                    "id": problem_id,
                    "status": "",
                    "ac_time": "",
                    "rivals": [],
                }

            if row["user_name"] == username:
                if resmap[problem_id]["status"] == "AC":
                    continue
                if row["status"] == "AC":
                    resmap[problem_id]["status"] = "AC"
                    resmap[problem_id]["ac_time"] = row["created_time"].isoformat(" ")
                else:
                    resmap[problem_id]["status"] = row["status"]
            elif row["status"] == "AC":
                resmap[problem_id]["rivals"].append(row["user_name"])
    connection.close()
    ret = []
    for k, v in resmap.items():
        v["rivals"] = list(set(v["rivals"]))
        ret.append(v)
    response.content_type = 'application/json'
    return json.dumps(ret, ensure_ascii=False, separators=(',', ':'))


def get_ranking(kind, lim=100000):
    query = "SELECT COUNT(submissions.id) AS count, user_name FROM problems"
    if kind == "fast":
        query += " LEFT JOIN submissions ON submissions.id=problems.fastest_submission_id"
    elif kind == "first":
        query += " LEFT JOIN submissions ON submissions.id=problems.first_submission_id"
    elif kind == "short":
        query += " LEFT JOIN submissions ON submissions.id=problems.shortest_submission_id"
    elif kind == "ac":
        query = "SELECT COUNT(DISTINCT(problem_id)) AS count, user_name FROM submissions WHERE status='AC'"
    else:
        return []
    query += " GROUP BY user_name ORDER BY count DESC LIMIT %s"
    connection = connect_my_sql()
    with connection.cursor() as cursor:
        cursor.execute(query, ((lim),))
        rows = cursor.fetchall()
        connection.close()
        for i in range(0, len(rows)):
            if i > 0 and rows[i - 1]["count"] == rows[i]["count"]:
                rows[i]["rank"] = rows[i - 1]["rank"]
            else:
                rows[i]["rank"] = i + 1
        return rows


@get("/ranking")
def ranking():
    kind = request.query.kind
    rows = get_ranking(kind=kind, lim=300)
    response.content_type = 'application/json'
    return json.dumps(rows, ensure_ascii=False, separators=(',', ':'))


@get("/user")
def user():
    username = request.query.user.lower()
    if re.match(r"^[a-zA-Z0-9_\-]*$", username) is None:
        return ""

    ac_rank = -1
    ac_num = 0
    for rank in get_ranking(kind="ac"):
        if rank["user_name"].lower() == username:
            ac_rank = rank["rank"]
            ac_num = rank["count"]
            username = rank["user_name"]
            break
    if ac_rank < 0:
        return ""

    user_dict = {
        "user": username,
        "ac_rank": ac_rank,
        "short_rank": 0,
        "fast_rank": 0,
        "first_rank": 0,
        "ac_num": ac_num,
        "short_num": 0,
        "fast_num": 0,
        "first_num": 0,
        "abc_a": 0,
        "abc_b": 0,
        "abc_c": 0,
        "abc_d": 0,
        "arc_a": 0,
        "arc_b": 0,
        "arc_c": 0,
        "arc_d": 0,
        "abc_num": 0,
        "arc_num": 0,
    }

    for rank in get_ranking(kind="first"):
        if rank["user_name"] == username:
            user_dict["first_rank"] = rank["rank"]
            user_dict["first_num"] = rank["count"]
            break

    for rank in get_ranking(kind="fast"):
        if rank["user_name"] == username:
            user_dict["fast_rank"] = rank["rank"]
            user_dict["fast_num"] = rank["count"]
            break

    for rank in get_ranking(kind="short"):
        if rank["user_name"] == username:
            user_dict["short_rank"] = rank["rank"]
            user_dict["short_num"] = rank["count"]
            break

    connection = connect_my_sql()
    with connection.cursor() as cursor:
        query = "SELECT id FROM contests"
        cursor.execute(query)
        for contest in cursor.fetchall():
            key = re.sub(r"^(a[br]c)[0-9]*$", r"\1_num", contest["id"])
            if key not in user_dict:
                continue
            user_dict[key] += 1
    with connection.cursor() as cursor:
        query = "SELECT DISTINCT(problem_id) FROM submissions WHERE user_name=%s AND status='AC'"
        cursor.execute(query, ((username),))
        for contest in cursor.fetchall():
            key = contest["problem_id"]
            key = key.replace("_1", "_a")
            key = key.replace("_2", "_b")
            key = key.replace("_3", "_c")
            key = key.replace("_4", "_d")
            key = re.sub(r"^(a[br]c)[0-9]*_([a-d])$", r"\1_\2", key)
            if key not in user_dict:
                continue
            user_dict[key] += 1
    connection.close()

    response.content_type = 'application/json'
    return json.dumps(user_dict, ensure_ascii=False, separators=(',', ':'))


@get("/results")
def results():
    username = request.query.user.lower()
    if re.match(r"^[a-zA-Z0-9_\-]*$", username) is None:
        username = ""

    rivals = request.query.rivals.lower()
    if re.match(r"^[a-z0-9_\-,]*$", rivals):
        rivals = rivals.strip().split(",")
    else:
        rivals = []

    searcher = set(rivals)
    searcher.add(username)
    if "" in searcher:
        searcher.remove("")
    if len(searcher) == 0:
        return ""

    connection = connect_my_sql()
    with connection.cursor() as cursor:
        query = "SELECT * FROM results WHERE user IN %s"
        cursor.execute(query, ((searcher),))
        rows = cursor.fetchall()
        connection.close()
        response.content_type = 'application/json'
        return json.dumps(rows, ensure_ascii=False, separators=(',', ':'))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    user = args.u
    password = args.p

    run(host='0.0.0.0', port=11451, debug=True, reloader=True)
