-- comment out for now because of the sqlx issue:
-- https://github.com/launchbadge/sqlx/issues/484
-- SET client_encoding = 'UTF8';

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
CREATE INDEX ON submissions (user_id);
CREATE INDEX ON submissions (LOWER(user_id));
CREATE INDEX ON submissions (epoch_second);

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

DROP TABLE IF EXISTS language_count;
CREATE TABLE language_count (
  user_id               VARCHAR(255) NOT NULL,
  simplified_language   VARCHAR(255) NOT NULL,
  problem_count         INT NOT NULL,
  PRIMARY KEY (user_id, simplified_language)
);

DROP TABLE IF EXISTS predicted_rating;
CREATE TABLE predicted_rating (
  user_id               VARCHAR(255) NOT NULL,
  rating                DOUBLE PRECISION,
  PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS contest_problem;
CREATE TABLE contest_problem (
  contest_id            VARCHAR(255) NOT NULL,
  problem_id            VARCHAR(255) NOT NULL,
  PRIMARY KEY (contest_id, problem_id)
);

DROP TABLE IF EXISTS max_streaks;
CREATE TABLE max_streaks (
  user_id               VARCHAR(255) NOT NULL,
  streak                BIGINT NOT NULL,
  PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS submission_count;
CREATE TABLE submission_count (
  user_id               VARCHAR(255) NOT NULL,
  count                 BIGINT NOT NULL,
  PRIMARY KEY (user_id)
);

-- For internal services:
DROP TABLE IF EXISTS internal_problem_list_items;
DROP TABLE IF EXISTS internal_problem_lists;

DROP TABLE IF EXISTS internal_virtual_contest_participants;
DROP TABLE IF EXISTS internal_virtual_contest_items;
DROP TABLE IF EXISTS internal_virtual_contests;

DROP TABLE IF EXISTS internal_progress_reset;

DROP TABLE IF EXISTS internal_users;

CREATE TABLE internal_users (
  internal_user_id      VARCHAR(255) NOT NULL,
  atcoder_user_id       VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (internal_user_id)
);

CREATE TABLE internal_problem_lists (
  internal_list_id      VARCHAR(255) NOT NULL,
  internal_user_id      VARCHAR(255) REFERENCES internal_users ON DELETE CASCADE ON UPDATE CASCADE,
  internal_list_name    VARCHAR(255) DEFAULT '',
  PRIMARY KEY (internal_list_id)
);
CREATE INDEX ON internal_problem_lists (internal_user_id);

CREATE TABLE internal_problem_list_items (
  internal_list_id      VARCHAR(255) REFERENCES internal_problem_lists ON DELETE CASCADE ON UPDATE CASCADE,
  problem_id            VARCHAR(255) NOT NULL,
  memo                  VARCHAR(255) DEFAULT '',
  PRIMARY KEY (internal_list_id, problem_id)
);
CREATE INDEX ON internal_problem_list_items (internal_list_id);

CREATE TABLE internal_virtual_contests (
  id        VARCHAR(255) NOT NULL,
  title     VARCHAR(255) DEFAULT '',
  memo      VARCHAR(255) DEFAULT '',
  internal_user_id     VARCHAR(255) REFERENCES internal_users ON DELETE CASCADE ON UPDATE CASCADE,
  start_epoch_second    BIGINT       NOT NULL,
  duration_second       BIGINT       NOT NULL,
  mode      VARCHAR(255) DEFAULT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  penalty_second   BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);
CREATE INDEX ON internal_virtual_contests (internal_user_id);
CREATE INDEX ON internal_virtual_contests (start_epoch_second);

CREATE TABLE internal_virtual_contest_items (
  problem_id    VARCHAR(255) NOT NULL,
  internal_virtual_contest_id VARCHAR(255) REFERENCES internal_virtual_contests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_defined_point    BIGINT DEFAULT NULL,
  user_defined_order    BIGINT DEFAULT NULL,
  PRIMARY KEY (problem_id, internal_virtual_contest_id)
);
CREATE INDEX ON internal_virtual_contest_items (internal_virtual_contest_id);

CREATE TABLE internal_virtual_contest_participants (
  internal_virtual_contest_id VARCHAR(255) REFERENCES internal_virtual_contests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  internal_user_id      VARCHAR(255) REFERENCES internal_users ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (internal_virtual_contest_id, internal_user_id)  
);
CREATE INDEX ON internal_virtual_contest_participants (internal_user_id);

CREATE TABLE internal_progress_reset (
  internal_user_id    VARCHAR(255) REFERENCES internal_users ON DELETE CASCADE ON UPDATE CASCADE,
  problem_id          VARCHAR(255) NOT NULL,
  reset_epoch_second  BIGINT NOT NULL,
  PRIMARY KEY (internal_user_id, problem_id)
);
CREATE INDEX ON internal_progress_reset (internal_user_id);
