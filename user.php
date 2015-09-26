<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$user_name = "";
if (isset ( $_GET ["name"] ) && preg_match ( '/^[\w]+$/', $_GET ["name"] )) {
	$user_name = $_GET ["name"];
	$user_name = mb_strtolower ( $user_name );
} else {
	$_GET ["name"] = "";
}

$sql = new SQLConnect ();

if (! isset ( $_GET ["name"] ) || ! $_GET ["name"]) {
	$exist = FALSE;
} else {
	$exist = $sql->isExist ( $user_name );
}
if ($exist) {
	$problemNum = $sql->getProblemNum ();
	$memberNum = getMemberNum ();
	
	$acNum = $sql->getACNum ( $user_name );
	$fastNum = getNum ( $user_name, "exec_faster" );
	$shortNum = getNum ( $user_name, "short_coder" );
	
	$acRank = getMyPlace ( $user_name, 1 );
	$shortRank = getMyPlace ( $user_name, 2 );
	$fastRank = getMyPlace ( $user_name, 3 );
	
	$evaluate = $sql->evaluateUser ( $user_name );
	
	$arc = array ();
	for($i = 1; $i <= 4; $i ++) {
		$num = $sql->likeACNum ( $user_name, "arc%\_" . chr ( 96 + $i ) );
		$num += $sql->likeACNum ( $user_name, "arc%\_" . $i );
		array_push ( $arc, $num );
		$num = $sql->likeProblemNum ( "arc%\_" . chr ( 96 + $i ) );
		$num += $sql->likeProblemNum ( "arc%\_" . $i );
		array_push ( $arc, $num );
	}
	
	$abc = array ();
	for($i = 1; $i <= 4; $i ++) {
		$num = $sql->likeACNum ( $user_name, "abc%\_" . chr ( 96 + $i ) );
		$num += $sql->likeACNum ( $user_name, "abc%\_" . $i );
		array_push ( $abc, $num );
		$num = $sql->likeProblemNum ( "abc%" . chr ( 96 + $i ) );
		$num += $sql->likeProblemNum ( "abc%\_" . $i );
		array_push ( $abc, $num );
	}
	
	$score = 0;
	for($i = 0; $i < 4; $i ++) {
		$score += $abc [$i * 2] * pow ( 2, $i );
	}
	for($i = 0; $i < 4; $i ++) {
		$score += $arc [$i * 2] * pow ( 2, ($i + 1) );
	}
}

// 表示
include 'view/user.inc';

// ランキングで何位かを返す
function getMyPlace($user_name, $flag) {
	$sql = new SQLConnect ();
	$ranking = array ();
	if ($flag == 1) {
		$r = $sql->pullRanking ();
	} elseif ($flag == 2) {
		$r = $sql->pullShortRanking ();
	} else {
		$r = $sql->pullFastRanking ();
	}
	
	foreach ( $r as $ranking_row ) {
		array_push ( $ranking, $ranking_row );
	}
	
	$rank = 1;
	foreach ( $ranking as $key => $value ) {
		$user = $value ["user"];
		$solves = $value [0];
		if ($solves != $ranking [$rank - 1] [0]) {
			$rank = $key + 1;
		}
		if (stristr ( $user, $user_name )) {
			return $rank;
		}
	}
	return getMemberNum ();
}

// ショートコード数を返す
function getNum($user_name, $type) {
	// $type=short_coder,exec_faster,fa_user
	$sql = new SQLConnect ();
	$query = "SELECT COUNT(user) AS count
				FROM problems LEFT JOIN submissions ON problems.$type=submissions.id
				WHERE user='$user_name' GROUP BY user";
	$count = 0;
	$data = $sql->exectute ( $query );
	foreach ( $data as $d ) {
		$count = max ( $count, $d ["count"] );
	}
	return $count;
}

// 全会員数を返す
function getMemberNum() {
	$sql = new SQLConnect ();
	$query = "SELECT COUNT(DISTINCT(user)) AS count FROM submissions;";
	$count = 0;
	$data = $sql->exectute ( $query );
	foreach ( $data as $d ) {
		$count = max ( $count, $d ["count"] );
	}
	return $count;
}

// レベル定義
function level($score) {
	if ($score == 0)
		return 1;
	elseif ($score < 5)
		return 2;
	elseif ($score < 10)
		return 3;
	elseif ($score < 20)
		return 4;
	elseif ($score < 40)
		return 5;
	elseif ($score < 60)
		return 6;
	elseif ($score < 80)
		return 7;
	elseif ($score < 100)
		return 8;
	elseif ($score < 150)
		return 9;
	elseif ($score < 300)
		return 10;
	elseif ($score < 500)
		return 11;
	elseif ($score < 800)
		return 12;
	elseif ($score < 1000)
		return 13;
	elseif ($score < 1300)
		return 14;
	else if ($score < 1600)
		return 15;
	else if ($score < 2000)
		return 16;
	else if ($score < 2500)
		return 17;
	
	return 18;
}
// レベル定義
function nextScore($score) {
	if ($score == 0)
		return 1;
	elseif ($score < 5)
		return 5;
	elseif ($score < 10)
		return 10;
	elseif ($score < 20)
		return 20;
	elseif ($score < 40)
		return 40;
	elseif ($score < 60)
		return 60;
	elseif ($score < 80)
		return 80;
	elseif ($score < 100)
		return 100;
	elseif ($score < 150)
		return 150;
	elseif ($score < 300)
		return 300;
	elseif ($score < 500)
		return 500;
	elseif ($score < 800)
		return 800;
	elseif ($score < 1000)
		return 1000;
	elseif ($score < 1300)
		return 1300;
	else if ($score < 1600)
		return 1600;
	else if ($score < 2000)
		return 2000;
	else if ($score < 2500)
		return 2500;
	
	return 4000;
}

?>