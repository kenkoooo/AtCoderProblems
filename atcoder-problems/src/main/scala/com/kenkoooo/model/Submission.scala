package com.kenkoooo.model

case class Submission(datetime: String,
                      problemId: String,
                      user: String,
                      language: String,
                      point: Long,
                      length: Int,
                      result: String,
                      executionTime: Option[Int],
                      id: Long)
