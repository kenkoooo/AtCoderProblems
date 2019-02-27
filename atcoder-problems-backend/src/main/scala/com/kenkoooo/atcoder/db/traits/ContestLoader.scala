package com.kenkoooo.atcoder.db.traits
import com.kenkoooo.atcoder.model.Contest

trait ContestLoader {
  def loadContest(): List[Contest]
}
