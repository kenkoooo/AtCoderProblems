package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.model.Contest

abstract class SubmissionScrapingRunner(private[runner] val contests: List[Contest]) {
  require(contests.nonEmpty, "contest list must not be empty")
  def scrapeOnePage(): SubmissionScrapingRunner
}
