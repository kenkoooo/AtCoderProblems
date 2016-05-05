import argparse

import ServerTools
import CrawlTools


def update_results(connection):
    contest_set = set(CrawlTools.get_contest_list())
    with connection.cursor() as cursor:
        query = "SELECT DISTINCT(contest) AS contest FROM results"
        cursor.execute(query)
        rows = cursor.fetchall()
    contest_set -= set([row["contest"] for row in rows])
    for contest in contest_set:
        result = CrawlTools.get_results(contest)
        if len(result) == 0:
            continue
        


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Server Application for AtCoder API.')
    parser.add_argument("-p", type=str)
    parser.add_argument("-u", type=str)
    args = parser.parse_args()
    sql_user = args.u
    sql_password = args.p

    conn = ServerTools.connect_my_sql(sql_user, sql_password)
    update_results(conn)
    conn.close()
