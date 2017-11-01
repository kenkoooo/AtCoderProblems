package com.kenkoooo.atcoder

import org.scalatra.test.scalatest._
import org.scalatest.FunSuiteLike

class AtCoderServletTests extends ScalatraSuite with FunSuiteLike {

  addServlet(classOf[AtCoderServlet], "/*")

  test("GET / on AtCoderServlet should return status 200"){
    get("/"){
      status should equal (200)
    }
  }

}
