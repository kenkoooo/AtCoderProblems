# -*- coding: utf-8 -*-
import unittest
from unittest.mock import Mock

from AtCoderSql import *


class AtCoderSqlTest(unittest.TestCase):
    def setUp(self):
        self.sql = Mock()
        self.sql.execute = Mock(return_value=[])

    def test_ranking(self):
        get_ranking(self.sql, "ac")
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT count, user_name FROM ac_ranking GROUP BY user_name ORDER BY count DESC LIMIT %s")
        get_ranking(self.sql, "fast")
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT COUNT(submissions.id) AS count, user_name FROM problems "
                         "LEFT JOIN submissions ON submissions.id=problems.fastest_submission_id GROUP BY user_name ORDER BY count DESC LIMIT %s")
        get_ranking(self.sql, "first")
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT COUNT(submissions.id) AS count, user_name FROM problems "
                         "LEFT JOIN submissions ON submissions.id=problems.first_submission_id GROUP BY user_name ORDER BY count DESC LIMIT %s")
        get_ranking(self.sql, "short")
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT COUNT(submissions.id) AS count, user_name FROM problems "
                         "LEFT JOIN submissions ON submissions.id=problems.shortest_submission_id GROUP BY user_name ORDER BY count DESC LIMIT %s")

    def test_results(self):
        users = ["kenkoooo"]
        get_results(self.sql, users)
        self.assertEqual(self.sql.execute.call_args[0][0], "SELECT * FROM results WHERE user IN %s")

    def test_problems(self):
        users = ["kenkoooo"]
        get_problems(self.sql, users)
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT status,problem_id,user_name,created_time FROM submissions WHERE user_name IN %s")

    def test_all_submissions(self):
        get_all_submissions(self.sql)
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT problems.id, problems.contest, problems.name, difficulty, solvers, shortest.id AS shortest_id, shortest.contest_id AS shortest_contest, shortest.source_length, shortest.user_name AS shortest_user, fastest.id AS fastest_id, fastest.contest_id AS fastest_contest, fastest.exec_time, fastest.user_name AS fastest_user, first.id AS first_id, first.contest_id AS first_contest, first.user_name AS first_user FROM problems LEFT JOIN submissions AS shortest ON problems.shortest_submission_id=shortest.id LEFT JOIN submissions AS fastest ON problems.fastest_submission_id=fastest.id LEFT JOIN submissions AS first ON problems.first_submission_id=first.id")

    def test_submissions(self):
        get_submissions(self.sql)
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT id,problem_id,source_length,exec_time FROM submissions WHERE status='AC'")

    def test_honor(self):
        update_honor(self.sql, {})
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "UPDATE problems SET shortest_submission_id=%(shortest)s,fastest_submission_id=%(fastest)s,first_submission_id=%(first)s WHERE id=%(problem_id)s")

    def test_solver_nums(self):
        get_solver_nums(self.sql)
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "SELECT COUNT(DISTINCT(user_name)) AS solvers, problem_id FROM submissions WHERE status='AC' GROUP BY problem_id")

    def test_insert_results(self):
        results = [{"user": "kenkoooo", "rank": 1}, {"user": "chokudai", "rank": 114514}]
        insert_results(self.sql, "arc999", results)
        print(self.sql.execute.call_args[0][0], )
        self.assertEqual(self.sql.execute.call_args[0][0],
                         "INSERT INTO results(contest,user,rank) VALUES ('arc999','kenkoooo', 1),('arc999','chokudai', 114514)")


if __name__ == '__main__':
    unittest.main()
