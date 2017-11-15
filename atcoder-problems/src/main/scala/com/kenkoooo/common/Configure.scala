package com.kenkoooo.common

case class Configure(scraper: ScraperConfig, sql: SQLConfig)

case class ScraperConfig(threads: Int)

case class SQLConfig(url: String, user: String, password: String)
