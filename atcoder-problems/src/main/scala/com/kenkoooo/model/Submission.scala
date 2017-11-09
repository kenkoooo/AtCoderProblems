package com.kenkoooo.model

case class Submission(epochSecond: Long,
                      problemId: String,
                      user: String,
                      language: String,
                      point: Long,
                      length: Int,
                      result: String,
                      executionTime: Option[Int],
                      id: Long)
