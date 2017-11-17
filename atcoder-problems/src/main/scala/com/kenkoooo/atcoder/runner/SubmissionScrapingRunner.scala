package com.kenkoooo.atcoder.runner

abstract class SubmissionScrapingRunner {
  def scrapeOnePage(): Option[SubmissionScrapingRunner]
}
