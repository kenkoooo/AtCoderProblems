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
);

CREATE TABLE problems (
  id            VARCHAR(255) NOT NULL,
  contest_id    VARCHAR(255) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE contests (
  id                    VARCHAR(255) NOT NULL,
  start_epoch_second    BIGINT       NOT NULL,
  duration_second       BIGINT       NOT NULL,
  PRIMARY KEY (id)
);


