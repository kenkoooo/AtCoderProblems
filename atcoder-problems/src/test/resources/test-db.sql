DROP TABLE IF EXISTS submissions;
CREATE TABLE submissions (
  id            BIGINT NOT NULL,
  epoch_second  BIGINT NOT NULL,
  problem_id    VARCHAR(255) NOT NULL,
  user_id       VARCHAR(255) NOT NULL,
  language      VARCHAR(255) NOT NULL,
  point         DOUBLE NOT NULL,
  length        INT NOT NULL,
  result        VARCHAR(255) NOT NULL,
  execution_time  INT,
  PRIMARY KEY (id)
) DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS problems;
CREATE TABLE problems (
  id            VARCHAR(255) NOT NULL,
  contest_id    VARCHAR(255) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS contests;
CREATE TABLE contests (
  id                    VARCHAR(255) NOT NULL,
  start_epoch_second    BIGINT       NOT NULL,
  duration_second       BIGINT       NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  rate_change           VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS solver;
CREATE TABLE solver (
  problem_id            VARCHAR(255)  NOT NULL,
  user_count               INT NOT NULL,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS shortest;
CREATE TABLE shortest (
  problem_id    VARCHAR(255)  NOT NULL,
  submission_id BIGINT  NOT NULL,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS fastest;
CREATE TABLE fastest (
  problem_id    VARCHAR(255)  NOT NULL,
  submission_id BIGINT  NOT NULL,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS first;
CREATE TABLE first (
  problem_id    VARCHAR(255)  NOT NULL,
  submission_id BIGINT  NOT NULL,
  PRIMARY KEY (problem_id)
);
