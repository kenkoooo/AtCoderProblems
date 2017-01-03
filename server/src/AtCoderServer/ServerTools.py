import re

import pymysql.cursors


def connect_my_sql(user, password):
    connection = pymysql.connect(
        host="localhost",
        user=user,
        password=password,
        db="atcoder",
        charset="utf8",
        cursorclass=pymysql.cursors.DictCursor)
    return connection


def is_alphanumeric(phrase):
    return re.match(r"^[a-zA-Z0-9_\-]*$", phrase)


def get_all_submissions(connection):
    with connection.cursor() as cursor:
        query = "SELECT" + \
                " problems.id, problems.contest, problems.name, difficulty, solvers," \
                " shortest.id AS shortest_id, shortest.contest_id AS shortest_contest, shortest.source_length," \
                " shortest.user_name AS shortest_user," \
                " fastest.id AS fastest_id, fastest.contest_id AS fastest_contest, fastest.exec_time," \
                " fastest.user_name AS fastest_user," \
                " first.id AS first_id, first.contest_id AS first_contest, first.user_name AS first_user" \
                " FROM problems" \
                " LEFT JOIN submissions AS shortest ON problems.shortest_submission_id=shortest.id" \
                " LEFT JOIN submissions AS fastest ON problems.fastest_submission_id=fastest.id" \
                " LEFT JOIN submissions AS first ON problems.first_submission_id=first.id"
        cursor.execute(query)
        rows = cursor.fetchall()
    return rows


def is_in_record(connection, table_name, column_name, value):
    with connection.cursor() as cursor:
        query = "SELECT " + column_name + " FROM " + table_name + " WHERE " + column_name + "=%s"
        cursor.execute(query, (value,))
        rows = cursor.fetchall()
        if len(rows) == 0:
            return False
        return True
