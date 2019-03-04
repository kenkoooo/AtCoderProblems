package com.kenkoooo.atcoder.db
import com.kenkoooo.atcoder.db.traits.ContestLoader
import com.kenkoooo.atcoder.model.Contest

import scala.concurrent.duration.Duration

class RecentContestLoader(contestLoader: ContestLoader, recent: Duration) extends ContestLoader {
  override def loadContest(): List[Contest] = {
    val contests = this.contestLoader.loadContest()
    val latestEnd = contests.map(c => c.startEpochSecond + c.durationSecond).max
    contests.filter(c => {
      val endSecond = c.startEpochSecond + c.durationSecond
      endSecond + recent.toSeconds >= latestEnd
    })
  }
}
