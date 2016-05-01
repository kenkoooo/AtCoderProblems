# -*- encoding:utf8 -*-
from bottle import get, run, response
import argparse
import pymysql.cursors
import json

user = ""
password = ""


def connect_my_sql():
    connection = pymysql.connect(host="localhost",
                                 user=user,
                                 password=password,
                                 db="atcoder",
                                 charset="utf8",
                                 cursorclass=pymysql.cursors.DictCursor)
    return connection


@get("/problems")
def problems():
    connection = connect_my_sql()
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM problems LIMIT 10")
        results = cursor.fetchall()
    connection.close()
    response.content_type = 'application/json'
    return json.dumps(results, ensure_ascii=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    user = args.u
    password = args.p

    run(host='0.0.0.0', port=11451, debug=True, reloader=True)
