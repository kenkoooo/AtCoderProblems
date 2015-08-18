<?php
require_once 'sql.php';

// sqlを呼ぶ
$sql = new SQLConnect ();

// とりあえずの日付を設定
$date = 20150908;

// もし引数が整数なら日付を更新
if (preg_match ( "/^[0-9]+$/", $_GET ["date"] )) {
	$date = $_GET ["date"];
}

// イベント問題情報
$problem_set = array ();
$query = "SELECT
		p.name AS problem_name, e.level, p.title, c.name AS contest_name
		FROM event AS e
		LEFT JOIN problems AS p ON e.problem_name=p.name
		LEFT JOIN contests AS c ON p.contest_id=c.id
		WHERE e.event_id=$date
		ORDER BY e.level ASC ";
$data = $sql->exectute ( $query );
foreach ( $data as $p ) {
	array_push ( $problem_set, $p );
}

// ユーザー情報
$user_data = array ();
$query = "SELECT * FROM member WHERE event_id=$date";
$event = $sql->exectute ( $query );
foreach ( $event as $e ) {
	$user_name = $e ["user_id"];
	foreach ( $problem_set as $set ) {
		$user_data [$user_name] [$set ["problem_name"]] = FALSE;
	}
	
	$query = "SELECT DISTINCT(problem_name) FROM submissions WHERE user='$user_name'";
	$submissions = $sql->exectute ( $query );
	foreach ( $submissions as $s ) {
		$solve = $s ["problem_name"];
		foreach ( $problem_set as $set ) {
			if (strstr ( $set ["problem_name"], $solve )) {
				$user_data [$user_name] [$solve] = TRUE;
			}
		}
	}
}

include 'view/practice.inc';