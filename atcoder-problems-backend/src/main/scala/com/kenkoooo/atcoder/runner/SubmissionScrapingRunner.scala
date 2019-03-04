package com.kenkoooo.atcoder.runner
import com.kenkoooo.atcoder.model.Contest

trait SubmissionScrapingRunner {
  def scrapeOnePage(): SubmissionScrapingRunner
  def contests: List[Contest]
}
