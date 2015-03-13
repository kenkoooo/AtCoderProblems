<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$user_name = $_GET ["name"];
$user_name = mb_strtolower ( $user_name );

$year = $_GET ["year"];
if (! isset ( $_GET ["year"] ) || $year <= 2011) {
	$year = 2012;
}

$abcArray = getProblemArray ( '/abc[0-9]*/i', $year, $user_name );
$arcArray = getProblemArray ( '/arc[0-9]*/i', $year, $user_name );
$allArray = getProblemArray ( '/^(?!.*(abc|arc)).*$/', $year, $user_name );

include 'html.inc';
function getProblemArray($pattern, $year, $user_name) {
	// 正規表現にマッチするコンテストネームの問題集を返す
	// $year以降のコンテストを返す
	$array = array ();
	$sql = new SQLConnect ();
	$pull = $sql->pullContests ();
	
	// コンテスト情報を取得
	foreach ( $pull as $element ) {
		$name = $element ["name"];
		$end = $element ["end"];
		
		if (preg_match ( $pattern, $name ) && strtotime ( $end ) > strtotime ( $year . "/01/01" )) {
			$array [$name] = $element;
		}
	}
	
	// 問題情報を取得
	foreach ( $array as $key => $contest ) {
		$problems = $sql->getProblems ( $contest ["id"] );
		foreach ( $problems as $p ) {
			$problem_name = $p ["name"];
			$array [$key] ["problems"] [$problem_name] = $p;
			$array [$key] ["problems"] [$problem_name] ["solved"] = FALSE;
		}
	}
	if (array_key_exists ( "name", $_GET ) && $user_name != "") {
		$solved = $sql->getSolved ( $user_name );
		foreach ( $solved as $sol ) {
			$contest_name = $sol ["contest_name"];
			$problem_name = $sol ["problem_name"];
			if (array_key_exists ( $contest_name, $array ) && array_key_exists ( "problems", $array [$contest_name] )) {
				$array [$contest_name] ["problems"] [$problem_name] ["solved"] = TRUE;
			}
		}
	}
	
	return $array;
}
function listupARC($array) {
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		echo '<tr>';
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		// コンテストタイトルを短くする
		$contest_title = str_replace ( "AtCoder Regular Contest", "ARC", $contest_title );
		$contest_title = str_replace ( "AtCoder Beginner Contest", "ABC", $contest_title );
		$contest_title = str_replace ( "#", "", $contest_title );
		
		echo "<td><a href='http://$contest_name.contest.atcoder.jp/'>";
		echo "$contest_title";
		echo "</a></td>";
		
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<td ";
			
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			}
			
			echo "><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name'>";
			echo $contest_problem_title;
			echo "</a>";
			echo "</td>";
		}
		
		echo '</tr>';
	}
}
function listupAnother($array) {
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		echo '<table class="table table-hover table-striped table-bordered table-condensed">';
		echo '<thead><tr>';
		
		echo date ( "Y-m-d", strtotime ( $contest ["end"] ) );
		echo "<a href='http://$contest_name.contest.atcoder.jp/'>";
		echo "$contest_title";
		echo "</a>";
		
		echo '</tr></thead>';
		echo '<tbody><tr>';
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<td ";
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			}
			echo "><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name'>";
			echo $contest_problem_title;
			echo "</a>";
			echo "</td>";
		}
		
		echo '</tr></tbody>';
		echo '</table>';
	}
}



