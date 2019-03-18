package com.kenkoooo.atcoder.common
import com.kenkoooo.atcoder.model.{AcceptedCount, ApiJsonSupport}
import org.scalatest.{FunSuite, Matchers}
import scala.io.Source
import JsonWriter._

class JsonWriterTest extends FunSuite with Matchers with ApiJsonSupport {
  test("write to temp json file") {
    val filepath = "/tmp/a.json"
    List(AcceptedCount("kenkoooo", 11)).toJsonFile(filepath)
    Source.fromFile(filepath).mkString shouldBe "[{\"user_id\":\"kenkoooo\",\"problem_count\":11}]"
  }
}
