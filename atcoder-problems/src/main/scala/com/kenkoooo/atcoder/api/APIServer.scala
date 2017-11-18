package com.kenkoooo.atcoder.api

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.stream.ActorMaterializer
import com.kenkoooo.atcoder.scraper.AtCoder

object APIServer extends App {
  implicit val system: ActorSystem = ActorSystem()
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  val route = get {
    path("problems") {
      parameters('user.?, 'rivals.?) { (userParam, rivalsParam) =>
        val user = userParam.filter(_.matches(AtCoder.UserNameRegex)).getOrElse("")
        val rivals = rivalsParam.getOrElse("").split(",").filter(_.matches(AtCoder.UserNameRegex))
        rivals.foreach(println)
        complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, s"<h1>$user</h1>"))
      }
    } ~ path("bye") {
      complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>bye</h1>"))
    }
  }

  val handler: HttpRequest => HttpResponse = {
    case r @ HttpRequest(HttpMethods.GET, Uri.Path("/"), _, _, _) =>
      val user =
        r.uri.query().toMap.get("user").filter(_.matches(AtCoder.UserNameRegex)).getOrElse("")
      val rivals =
        r.uri
          .query()
          .toMap
          .getOrElse("rivals", "")
          .split(",")
          .filter(_.matches(AtCoder.UserNameRegex))
      if (user == "kenkoooo") {
        HttpResponse(status = StatusCodes.NotModified)
      } else {
        HttpResponse(entity = HttpEntity(ContentTypes.`text/html(UTF-8)`, s"<h1>$user</h1>"))
      }

    case r: HttpRequest =>
      r.discardEntityBytes()
      HttpResponse(404, entity = "Unknown resource!")
  }

  val bridgeFuture = Http().bindAndHandleSync(handler, "localhost", 8080)
}
