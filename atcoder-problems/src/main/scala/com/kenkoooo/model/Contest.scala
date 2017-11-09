package com.kenkoooo.model

import scala.concurrent.duration.Duration

case class Contest(id: String, startEpochSecond: Long, duration: Duration)
