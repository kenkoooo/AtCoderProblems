CREATE TABLE `ac_ranking` (
  `user_name` varchar(255) CHARACTER SET utf8 NOT NULL,
  `ac` int(11) NOT NULL,
  PRIMARY KEY (`user_name`)
);

CREATE TABLE `contests` (
  `id` varchar(255) CHARACTER SET utf8 NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 NOT NULL,
  `start_sec` bigint(20) NOT NULL,
  `end_sec` bigint(20) NOT NULL,
  `last_crawled` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `problems` (
  `id` varchar(255) NOT NULL,
  `contest` varchar(255) CHARACTER SET utf8 NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 NOT NULL,
  `shortest_submission_id` bigint(20) NOT NULL DEFAULT '0',
  `fastest_submission_id` bigint(20) NOT NULL DEFAULT '0',
  `first_submission_id` bigint(20) NOT NULL DEFAULT '0',
  `difficulty` int(11) NOT NULL DEFAULT '-1',
  `solvers` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

CREATE TABLE `results` (
  `contest` varchar(255) NOT NULL,
  `user` varchar(255) NOT NULL,
  `rank` int(11) NOT NULL
);

CREATE TABLE `submissions` (
  `id` bigint(20) NOT NULL,
  `problem_id` varchar(255) NOT NULL,
  `contest_id` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `source_length` bigint(20) NOT NULL,
  `point` bigint(20) NOT NULL DEFAULT '0',
  `language` varchar(255) NOT NULL,
  `exec_time` bigint(20) NOT NULL DEFAULT '0',
  `created_time_sec` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_name` (`user_name`),
  KEY `user_name_2` (`user_name`,`id`)
);
