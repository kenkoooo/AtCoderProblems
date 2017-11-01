package com.kenkoooo.atcoder

import org.scalatra._

class AtCoderServlet extends ScalatraServlet {

  get("/") {
    views.html.hello()
  }

}
