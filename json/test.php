<?php
require_once '../sql.php';

$user_name = "kenkoooo";
// 正規表現にマッチするコンテストネームの問題集を返す
// $year以降のコンテストを返す
$array = array ();
$sql = new SQLConnect ();
$pull = $sql->pullContests ();
$rivals_array = array_unique ( explode ( ',', $rivals ) );

// コンテスト情報を取得
foreach ( $pull as $element ) {
	$name = $element ["name"];
	$array [$name] = $element;
}

$problems = $sql->pullProblems ();
foreach ( $problems as $p ) {
	$problem_name = $p ["problem_name"];
	$contest_name = $p ["contest_name"];
	$array [$contest_name] ["problems"] [$problem_name] = $p;
	$array [$contest_name] ["problems"] [$problem_name] ["solved"] = FALSE;
	$array [$contest_name] ["problems"] [$problem_name] ["rival_solved"] = FALSE;
	$array [$contest_name] ["problems"] [$problem_name] ["rivals"] = "";
}

// 自分のAC情報を取得
if ($user_name === "") {
	return $array;
}
$my_solved = $sql->getSolved ( $user_name );
foreach ( $my_solved as $solved_contest ) {
	$contest_name = $solved_contest ["contest_name"];
	$problem_name = $solved_contest ["problem_name"];
	if (array_key_exists ( $contest_name, $array ) && array_key_exists ( "problems", $array [$contest_name] )) {
		$array [$contest_name] ["problems"] [$problem_name] ["solved"] = TRUE;
	}
}

if (count ( $rivals_array ) == 0) {
	return $array;
}
foreach ( $rivals_array as $rival_name ) {
	if ($rival_name === "") {
		continue;
	}
	
	$rival_solved = $sql->getSolved ( $rival_name );
	foreach ( $rival_solved as $rival_contest ) {
		$contest_name = $rival_contest ["contest_name"];
		$problem_name = $rival_contest ["problem_name"];
		
		if (! array_key_exists ( $contest_name, $array ) || ! array_key_exists ( "problems", $array [$contest_name] )) {
			continue;
		}
		
		$array [$contest_name] ["problems"] [$problem_name] ["rival_solved"] = TRUE;
		$tmp = $array [$contest_name] ["problems"] [$problem_name] ["rivals"];
		$array [$contest_name] ["problems"] [$problem_name] ["rivals"] = $tmp . "," . $rival_name;
	}
}
json_encode ( $array );
