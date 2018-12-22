package com.kenkoooo.atcoder.common

import java.io.PrintWriter
import org.apache.logging.log4j.scala.Logging
import spray.json._

object JsonWriter extends Logging {
  implicit class JsonFileWriter[T](any: T) {
    def toJsonFile(filepath: String)(implicit writer: JsonWriter[T]): Unit = {
      logger.info(s"writing to $filepath ...")
      val file = new PrintWriter(filepath)
      file.write(any.toJson(writer).toString())
      file.close()
      logger.info(s"finished writing to $filepath")
    }
  }
}
