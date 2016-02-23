import MySQLdb
import MySQLdb.cursors
import sys
import re

RATING_K = 2.2
USE_NUM = 30


def eloRating(users, R):
    for i in xrange(0, len(users)):
        if users[i] not in R:
            R[users[i]] = 1500.0
    E = [0.0 for _ in range(len(users))]
    for i in xrange(0, len(users)):
        for j in xrange(0, len(users)):
            if i == j:
                continue
            ui = users[i]
            uj = users[j]
            try:
                E[i] += 1.0 / (1.0 + 10.0**((R[uj] - R[ui]) / 400.0))
            except:
                print R[uj]
                print R[ui]
                E[i] += 1.0 / (1.0 + 10.0**((R[uj] - R[ui]) / 400.0))
    for i in xrange(0, len(E)):
        R[users[i]] = R[users[i]] + RATING_K * (len(E) - 1.0 - i - E[i])

    return R


def getSolvers(connection):
    cursor = connection.cursor()
    cursor.execute(
        "SELECT problem_id, user_name FROM submissions " +
        "LEFT JOIN contests ON contests.id=submissions.contest_id " +
        "WHERE status='AC' AND created_time<end"
    )
    submissions = cursor.fetchall()
    cursor.close()
    solvers = {}
    for row in submissions:
        problem_id = row["problem_id"]
        user_name = row["user_name"]
        if problem_id not in solvers:
            solvers[problem_id] = []
        solvers[problem_id].append(user_name)
    for problem_id in solvers:
        solvers[problem_id] = list(set(solvers[problem_id]))
    return solvers


def getProblemList(connection):
    problem_list = {}
    cursor = connection.cursor()
    cursor.execute("SELECT id, contest FROM problems")
    problems = cursor.fetchall()
    cursor.close()

    for row in problems:
        if row["contest"] not in problem_list:
            problem_list[row["contest"]] = []
        problem_list[row["contest"]].append(row["id"])

    return problem_list


def mySQL(user, passwd):
    connection = MySQLdb.connect(
        db="atcoder",
        user=user,
        passwd=passwd,
        cursorclass=MySQLdb.cursors.DictCursor,
    )

    cursor = connection.cursor()
    cursor.execute(
        "SELECT contest, user, rank FROM results " +
        "LEFT JOIN contests ON results.contest=contests.id " +
        "ORDER BY start ASC, contest ASC, rank ASC"
    )
    ranks = cursor.fetchall()
    cursor.close()

    bottom_ranks = {}
    for row in ranks:
        bottom_ranks[row["contest"]] = row["rank"]

    ratings = {}
    users = []
    pre_difficulties = {}
    problem_list = getProblemList(connection)
    solvers = getSolvers(connection)
    for i in xrange(0, len(ranks)):
        if ranks[i]["rank"] < bottom_ranks[ranks[i]["contest"]]:
            users.append(ranks[i]["user"])
        if i == len(ranks) - 1 or ranks[i]["contest"] != ranks[i + 1]["contest"]:
            if re.match(r"^arc[0-9]*$", ranks[i]["contest"]):
                ratings = eloRating(users, ratings)

            users = []
            if ranks[i]["contest"] not in problem_list:
                continue
            for problem in problem_list[ranks[i]["contest"]]:
                if problem not in pre_difficulties:
                    pre_difficulties[problem] = []
                if problem not in solvers:
                    continue
                for solver in solvers[problem]:
                    if solver in ratings:
                        pre_difficulties[problem].append(ratings[solver])

    sortedList = sorted(ratings.items(), key=lambda x: x[1])
    difficulties = {}
    for problem in pre_difficulties:
        num = min(USE_NUM, len(pre_difficulties[problem]))
        if num == 0:
            continue
        sortedRating = sorted(pre_difficulties[problem])
        s = 0.0
        for i in xrange(0, num):
            s += sortedRating[i]
        difficulties[problem] = s / num

    sortedDifficulties = sorted(difficulties.items(), key=lambda x: x[1])
    query = "UPDATE problems SET difficulty = CASE id "
    for d in sortedDifficulties:
        query = query + " WHEN '" + d[0] + "' THEN " + str(int(d[1]))
    query = query + " END WHERE id IN ("

    for i in xrange(0, len(sortedDifficulties)):
        if i > 0:
            query = query + ","
        query = query + "'" + sortedDifficulties[i][0] + "'"
    query = query + ")"
    print query
    cursor = connection.cursor()
    cursor.execute(query)
    connection.commit()
    cursor.close()
    connection.close()

if __name__ == '__main__':
    mySQL(sys.argv[1], sys.argv[2])
