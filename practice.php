<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

// sqlを呼ぶ
$sql = new SQLConnect();

// とりあえずの日付を設定
$date = 20151018;

// もし引数が整数なら日付を更新
if (preg_match("/^[0-9]+$/", $_GET["date"])) {
	$date = $_GET["date"];
}

// ユーザー絞り込み
$search = "";
if (preg_match("/^[0-9a-zA-Z,_]+$/", $_GET["search"])) {
	$search = $_GET["search"];
}

// イベント問題情報
$problem_set = array();
$query = "SELECT
		p.name AS problem_name, e.level, p.title, c.name AS contest_name
		FROM event AS e
		LEFT JOIN problems AS p ON e.problem_name=p.name
		LEFT JOIN contests AS c ON p.contest_id=c.id
		WHERE e.event_id=$date
		ORDER BY problem_name ASC";
$data = $sql->exectute($query);
foreach ($data as $p) {
	array_push($problem_set, $p);
}

// ユーザー情報
$user_data = array();
$query = "SELECT * FROM member WHERE event_id=$date";

// 絞りこみ有効時
if (strlen($search) > 0) {
	$search_array = explode(',', $search);
	$query .= " AND user_id IN (";
	for ($i = 0; $i < count($search_array); $i++) {
		$query .= "'$search_array[$i]'";
		if ($i != count($search_array) - 1) {
			$query .= ",";
		}
	}
	$query .= ")";
}

// アルファベット順
$query .= " ORDER BY user_id ASC";
$event = $sql->exectute($query);

// イベント用問題のAC or not を配列に記録していく
foreach ($event as $e) {
	$user_name = $e["user_id"];
	foreach ($problem_set as $set) {
		$user_data[$user_name][$set["problem_name"]] = FALSE;
	}

	$query = "SELECT DISTINCT(problem_name) FROM submissions WHERE user='$user_name'";
	$submissions = $sql->exectute($query);
	foreach ($submissions as $s) {
		$solve = $s["problem_name"];
		foreach ($problem_set as $set) {
			if (strstr($set["problem_name"], $solve)) {
				$user_data[$user_name][$solve] = TRUE;
			}
		}
	}
}

// ユーザー名を記録していく
foreach ($user_data as $user_name => $value) {
	$screen_name = "";
	$html = file_get_html("http://arc001.contest.atcoder.jp/users/" . $user_name);
	foreach ($html->find(h3) as $h3) {
		$screen_name = $h3->plaintext;
	}
	$user_data[$user_name]["screen_name"] = $screen_name;
}

include 'view/practice.inc';