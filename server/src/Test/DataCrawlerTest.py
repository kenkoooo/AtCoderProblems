import sys

sys.path.append("../AtCoderServer/")
import DataCrawler
import unittest


class TestCalc(unittest.TestCase):
    def test_get_problem_set(self):
        problem_map, times, contest_name = DataCrawler.get_problem_set("arc052")
        self.assertEqual(len(problem_map), 4)
        self.assertEqual(len(times), 2)
        self.assertEqual(contest_name, 'AtCoder Regular Contest 052')

        problem_map, times, contest_name = DataCrawler.get_problem_set("arc999")
        self.assertEqual(len(problem_map), 0)

    def test_get_contest_list(self):
        list = DataCrawler.get_contest_list()
