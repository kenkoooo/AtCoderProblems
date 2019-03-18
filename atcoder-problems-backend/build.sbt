name := "atcoder-problems"

version := "0.1"

scalaVersion := "2.12.4"

libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-http" % "10.0.10",
  "com.typesafe.akka" %% "akka-http-spray-json" % "10.0.10",
  "net.ruippeixotog" %% "scala-scraper" % "2.0.0",
  "org.scalikejdbc" %% "scalikejdbc" % "3.1.+",
  "org.postgresql" % "postgresql" % "42.1.4",
  "org.apache.logging.log4j" % "log4j-api" % "2.9.1",
  "org.apache.logging.log4j" % "log4j-core" % "2.9.1",
  "org.apache.logging.log4j" %% "log4j-api-scala" % "11.0",
  "com.github.pureconfig" %% "pureconfig" % "0.8.0",
  "org.scalatest" %% "scalatest" % "3.0.4" % "test",
  "org.mockito" % "mockito-core" % "2.23.4" % "test",
  "com.tumblr" %% "colossus-testkit" % "0.10.1" % "test",
  "com.typesafe.akka" % "akka-http-testkit_2.12" % "10.0.10" % "test"
)

parallelExecution in Test := false