SET client_encoding = 'UTF8';

DROP TABLE IF EXISTS submissions;
CREATE TABLE submissions (
  id            BIGINT NOT NULL,
  epoch_second  BIGINT NOT NULL,
  problem_id    VARCHAR(255) NOT NULL,
  contest_id    VARCHAR(255) NOT NULL,
  user_id       VARCHAR(255) NOT NULL,
  language      VARCHAR(255) NOT NULL,
  point         DOUBLE PRECISION NOT NULL,
  length        INT NOT NULL,
  result        VARCHAR(255) NOT NULL,
  execution_time  INT,
  PRIMARY KEY (id)
);

DROP TABLE IF EXISTS problems;
CREATE TABLE problems (
  id            VARCHAR(255) NOT NULL,
  contest_id    VARCHAR(255) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

DROP TABLE IF EXISTS contests;
CREATE TABLE contests (
  id                    VARCHAR(255) NOT NULL,
  start_epoch_second    BIGINT       NOT NULL,
  duration_second       BIGINT       NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  rate_change           VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

DROP TABLE IF EXISTS solver;
CREATE TABLE solver (
  problem_id            VARCHAR(255)  NOT NULL,
  user_count               INT NOT NULL,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS shortest;
CREATE TABLE shortest (
  contest_id    VARCHAR(255)  NOT NULL,
  problem_id    VARCHAR(255)  NOT NULL,
  submission_id BIGINT  NOT NULL,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS fastest;
CREATE TABLE fastest (
  contest_id    VARCHAR(255)  NOT NULL,
  problem_id    VARCHAR(255)  NOT NULL,
  submission_id BIGINT  NOT NULL,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS first;
CREATE TABLE first (
  contest_id    VARCHAR(255)  NOT NULL,
  problem_id    VARCHAR(255)  NOT NULL,
  submission_id BIGINT  NOT NULL,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS shortest_submission_count;
CREATE TABLE shortest_submission_count (
  user_id       VARCHAR(255)  NOT NULL,
  problem_count INT           NOT NULL,
  PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS fastest_submission_count;
CREATE TABLE fastest_submission_count (
  user_id       VARCHAR(255)  NOT NULL,
  problem_count INT           NOT NULL,
  PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS first_submission_count;
CREATE TABLE first_submission_count (
  user_id       VARCHAR(255)  NOT NULL,
  problem_count INT           NOT NULL,
  PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS accepted_count;
CREATE TABLE accepted_count (
  user_id       VARCHAR(255)  NOT NULL,
  problem_count INT           NOT NULL,
  PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS points;
CREATE TABLE points (
  problem_id            VARCHAR(255) NOT NULL,
  point                 DOUBLE PRECISION,
  predict                 DOUBLE PRECISION,
  PRIMARY KEY (problem_id)
);

DROP TABLE IF EXISTS rated_point_sum;
CREATE TABLE rated_point_sum (
  user_id         VARCHAR(255) NOT NULL,
  point_sum       DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (user_id)
);
