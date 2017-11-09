name := "atcoder-problems"

version := "0.1"

scalaVersion := "2.12.4"

libraryDependencies ++= Seq(
  "com.tumblr" %% "colossus" % "0.10.1",
  "net.ruippeixotog" %% "scala-scraper" % "2.0.0",
  "org.scalikejdbc" %% "scalikejdbc"        % "3.1.+",
  "com.h2database"  %  "h2"                 % "1.4.+",
  "org.scalatest" %% "scalatest" % "3.0.4" % "test",
  "org.mockito" % "mockito-core" % "2.8.47" % "test",
  "com.tumblr" %% "colossus-testkit" % "0.10.1" % "test"
)

