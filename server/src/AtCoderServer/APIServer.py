# -*- encoding:utf8 -*-

import argparse
import json
import re

from bottle import get, run, response, request

from ServerTools import is_alphanumeric

from AtCoderSql import AtCoderSql, get_results, get_problems, get_ranking

sql_user = ""
sql_password = ""


@get("/problems")
def problems():
    username = request.query.user.lower()
    if not is_alphanumeric(username):
        username = ""

    rivals = request.query.rivals.lower().split(",")
    searcher = set([x.strip() for x in rivals if is_alphanumeric(x.strip())])
    searcher.add(username)

    if "" in searcher:
        searcher.remove("")
    if len(searcher) == 0:
        response.content_type = 'application/json'
        return json.dumps([], ensure_ascii=False, separators=(',', ':'))

    response_map = {}
    rows = get_problems(AtCoderSql(sql_user, sql_password), searcher)

    for row in rows:
        problem_id = row["problem_id"]
        if problem_id not in response_map:
            response_map[problem_id] = {
                "id": problem_id,
                "status": "",
                "ac_time": "",
                "rivals": [],
            }

        if row["user_name"].lower() == username.lower():
            if response_map[problem_id]["status"] == "AC":
                continue

            if row["status"] == "AC":
                response_map[problem_id]["status"] = "AC"
                response_map[problem_id]["ac_time"] = row["created_time"].isoformat(" ")
            else:
                response_map[problem_id]["status"] = row["status"]
        elif row["status"] == "AC":
            response_map[problem_id]["rivals"].append(row["user_name"])

    ret = []
    for k, v in response_map.items():
        v["rivals"] = list(set(v["rivals"]))
        ret.append(v)
    response.content_type = 'application/json'
    return json.dumps(ret, ensure_ascii=False, separators=(',', ':'))


@get("/ranking")
def ranking():
    kind = request.query.kind
    rows = get_ranking(AtCoderSql(sql_user, sql_password), kind=kind, lim=300)
    response.content_type = 'application/json'
    return json.dumps(rows, ensure_ascii=False, separators=(',', ':'))


@get("/user")
def user():
    username = request.query.user.lower()
    if not is_alphanumeric(username) or username == "":
        response.content_type = 'application/json'
        return json.dumps({"ac_rank": 0}, ensure_ascii=False, separators=(',', ':'))

    ac_rank = -1
    ac_num = 0
    connection = AtCoderSql(sql_user, sql_password)
    for rank in get_ranking(connection, kind="ac"):
        if rank["user_name"].lower() == username:
            ac_rank = rank["rank"]
            ac_num = rank["count"]
            username = rank["user_name"]
            break

    if ac_rank < 0:
        response.content_type = 'application/json'
        return json.dumps({"ac_rank": 0}, ensure_ascii=False, separators=(',', ':'))

    user_dict = {
        "user": username, "ac_rank": ac_rank, "short_rank": 0, "fast_rank": 0, "first_rank": 0, "ac_num": ac_num,
        "short_num": 0, "fast_num": 0, "first_num": 0, "abc_a": 0, "abc_b": 0, "abc_c": 0, "abc_d": 0, "arc_a": 0,
        "arc_b": 0, "arc_c": 0, "arc_d": 0, "abc_num": 0, "arc_num": 0, }

    for rank in get_ranking(connection, "first"):
        if rank["user_name"] == username:
            user_dict["first_rank"] = rank["rank"]
            user_dict["first_num"] = rank["count"]
            break

    for rank in get_ranking(connection, "fast"):
        if rank["user_name"] == username:
            user_dict["fast_rank"] = rank["rank"]
            user_dict["fast_num"] = rank["count"]
            break

    for rank in get_ranking(connection, "short"):
        if rank["user_name"] == username:
            user_dict["short_rank"] = rank["rank"]
            user_dict["short_num"] = rank["count"]
            break

    # ABC/ARC の数をカウント
    query = "SELECT id FROM contests"
    for contest in connection.execute(query, ()):
        key = re.sub(r"^(a[br]c)[0-9]*$", r"\1_num", contest["id"])
        if key in user_dict:
            user_dict[key] += 1

    problem_set = set()
    for problem in get_problems(connection, [username]):
        if problem["status"] != "AC":
            continue
        problem_id = problem["problem_id"]
        problem_id = problem_id.replace("_1", "_a")
        problem_id = problem_id.replace("_2", "_b")
        problem_id = problem_id.replace("_3", "_c")
        problem_id = problem_id.replace("_4", "_d")
        problem_set.add(problem_id)

    for problem_id in problem_set:
        # ARC058 以降の AB 問題は ABC の CD 問題ということにする
        if re.match(r"^arc[0-9]*_[ab]$", problem_id):
            num = re.sub(r"^arc([0-9]*)_([ab])$", r"\1", problem_id)
            num = int(num)
            if num >= 58:
                problem_id = problem_id.replace("_a", "_c")
                problem_id = problem_id.replace("_b", "_d")
                problem_id = problem_id.replace("arc", "abc")

        problem_id = re.sub(r"^(a[br]c)[0-9]*_([a-d])$", r"\1_\2", problem_id)

        if problem_id in user_dict:
            user_dict[problem_id] += 1

    response.content_type = 'application/json'
    return json.dumps(user_dict, ensure_ascii=False, separators=(',', ':'))


@get("/results")
def results():
    username = request.query.user.lower()
    if not is_alphanumeric(username):
        username = ""

    rivals = request.query.rivals.lower().split(",")
    searcher = set([x.strip() for x in rivals if is_alphanumeric(x.strip())])
    searcher.add(username)

    if "" in searcher:
        searcher.remove("")
    if len(searcher) == 0:
        response.content_type = 'application/json'
        return json.dumps([], ensure_ascii=False, separators=(',', ':'))

    connection = AtCoderSql(sql_user, sql_password)
    rows = get_results(connection, searcher)
    response.content_type = 'application/json'
    return json.dumps(rows, ensure_ascii=False, separators=(',', ':'))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p

    run(host='0.0.0.0', port=55555, debug=True, reloader=True)
