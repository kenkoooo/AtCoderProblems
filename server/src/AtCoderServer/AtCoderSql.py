import pymysql


class AtCoderSql:
    def __init__(self, user, password):
        self.connection = None
        self.user = user
        self.password = password

    def connect(self):
        self.connection = pymysql.connect(
            host="localhost",
            user=self.user,
            password=self.password,
            db="atcoder",
            charset="utf8",
            cursorclass=pymysql.cursors.DictCursor)

    def execute(self, query, params):
        self.connect()
        with self.connection.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
        self.connection.close()
        self.connection = None

        return rows


def get_ranking(sql, kind, lim=100000):
    query = "SELECT COUNT(submissions.id) AS count, user_name FROM problems LEFT JOIN submissions ON submissions.id={id} GROUP BY user_name ORDER BY count DESC LIMIT %s"
    if kind == "fast":
        query = query.format(id="problems.fastest_submission_id")
    elif kind == "first":
        query = query.format(id="problems.first_submission_id")
    elif kind == "short":
        query = query.format(id="problems.shortest_submission_id")
    elif kind == "ac":
        query = "SELECT count, user_name FROM ac_ranking GROUP BY user_name ORDER BY count DESC LIMIT %s"
    else:
        return []

    rows = sql.execute(query, (lim,))
    for i in range(0, len(rows)):
        if i > 0 and rows[i - 1]["count"] == rows[i]["count"]:
            rows[i]["rank"] = rows[i - 1]["rank"]
        else:
            rows[i]["rank"] = i + 1
    return rows


def get_results(connection, users):
    query = "SELECT * FROM results WHERE user IN %s"
    return connection.execute(query, (users,))


def get_problems(connection, users):
    query = "SELECT status,problem_id,user_name,created_time FROM submissions WHERE user_name IN %s"
    return connection.execute(query, (users,))
