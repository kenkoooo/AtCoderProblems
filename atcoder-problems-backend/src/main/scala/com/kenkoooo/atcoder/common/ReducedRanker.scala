package com.kenkoooo.atcoder.common

object ReducedRanker {
  implicit class ReducedRankerImplicit[T](val self: List[T]) {
    def reduceToMap: Map[T, Int] = {
      var map = Map[T, Int]()
      for ((point, index) <- self.zipWithIndex) {
        if (index == 0 || point != self(index - 1)) {
          map += (point -> index)
        }
      }
      map
    }
  }
}
