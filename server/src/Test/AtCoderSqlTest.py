# -*- coding: utf-8 -*-
import unittest
from unittest.mock import Mock

from AtCoderSql import get_ranking, get_results


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


if __name__ == '__main__':
    unittest.main()
