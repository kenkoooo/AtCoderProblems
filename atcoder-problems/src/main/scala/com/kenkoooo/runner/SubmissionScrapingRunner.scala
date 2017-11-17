package com.kenkoooo.runner

abstract class SubmissionScrapingRunner {
  def scrapeOnePage(): Option[SubmissionScrapingRunner]
}
