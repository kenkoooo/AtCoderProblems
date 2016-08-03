# -*- coding: utf-8 -*-
import unittest

import CrawlTools


class CrawlerToolsTest(unittest.TestCase):
    def test_get_contest_list(self):
        print(CrawlTools.get_contest_list())


if __name__ == '__main__':
    unittest.main()
