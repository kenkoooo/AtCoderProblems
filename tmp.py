import MySQLdb
import MySQLdb.cursors
import sys
import re
import numpy as np


def mySQL(user, passwd):
    tekito = 20

    connection = MySQLdb.connect(
        db="atcoder",
        user=user,
        passwd=passwd,
        cursorclass=MySQLdb.cursors.DictCursor,
    )

    cursor = connection.cursor()
    cursor.execute(
        "Select id, problem_id, contest_id, user_name FROM submissions WHERE status='AC'"
    )
    submissions = cursor.fetchall()
    cursor.close()

    solvers_set = {}
    for row in submissions:
        if row["problem_id"] not in solvers_set:
            solvers_set[row["problem_id"]] = set()
        solvers_set[row["problem_id"]].add(row["user_name"])

    user_points = {}
    for problem in solvers_set:
        solver_num = len(solvers_set[problem])
        for user in solvers_set[problem]:
            if user not in user_points:
                user_points[user] = []
            user_points[user].append(solver_num)

    rating = {}
    for user in user_points:
        user_points[user].sort()
        if len(user_points[user]) < tekito:
            continue
        s = 0
        for i in xrange(0, tekito):
            s += user_points[user][i]
        rating[user] = float(s) / tekito

    problem_ratings = {}
    difficulty = []
    for problem in solvers_set:
        problem_ratings[problem] = []
        for user in solvers_set[problem]:
            if user not in rating:
                continue
            problem_ratings[problem].append(rating[user])
        problem_ratings[problem].sort()
        problem_ratings[problem].reverse()
        mi = min(tekito, len(problem_ratings[problem]))
        if mi == 0:
            continue
        s = 0
        for i in xrange(0, mi):
            s += problem_ratings[problem][i]
        difficulty.append((problem, np.ceil(10000 / s * mi)))
    difficulty = sorted(difficulty, key=lambda t: t[1])

    query = "UPDATE problems SET difficulty = CASE id "
    for d in difficulty:
        query = query + " WHEN '" + d[0] + "' THEN " + str(int(d[1]))
    query = query + " END WHERE id IN ("

    for i in xrange(0, len(difficulty)):
        if i > 0:
            query = query + ","
        query = query + "'" + difficulty[i][0] + "'"
    query = query + ")"

    cursor = connection.cursor()
    cursor.execute(query)
    connection.commit()
    cursor.close()
    connection.close()

if __name__ == '__main__':
    mySQL(sys.argv[1], sys.argv[2])
