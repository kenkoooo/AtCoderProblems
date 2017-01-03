# -*- coding: utf-8 -*-
import unittest

import CrawlTools


class CrawlerToolsTest(unittest.TestCase):
    def test_result_json(self):
        contest = "code-festival-2016-quala"
        result = CrawlTools.get_result_json(contest)
        self.assertEqual(len(result), 1396)
        self.assertEqual(result[0]["user_screen_name"], "tourist")

        contest = "code-festival-2016-qualx"
        result = CrawlTools.get_result_json(contest)
        self.assertEqual(len(result), 0)


if __name__ == '__main__':
    unittest.main()
