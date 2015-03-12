<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$user_name = 'kenkoooo';

$abcArray = getProblemArray ( '/abc[0-9]*/i', 2012, $user_name );
$arcArray = getProblemArray ( '/arc[0-9]*/i', 2012, $user_name );
$allArray = getProblemArray ( '/^(?!.*(abc|arc)).*$/', 2013, $user_name );

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
	
	$solved = $sql->getSolved ( $user_name );
	foreach ( $solved as $sol ) {
		$contest_name = $sol ["contest_name"];
		$problem_name = $sol ["problem_name"];
		if (array_key_exists ( $contest_name, $array )) {
			$array [$contest_name] ["problems"] [$problem_name] ["solved"] = TRUE;
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
		
		echo "<td><a href='http://$contest_name.contest.atcoder.jp/'>";
		echo "$contest_title";
		echo "</a></td>";
		
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<td><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name'>";
			echo $contest_problem_title;
			echo "</a>";
			if ($contest_problem ["solved"]) {
				echo "<br><span class='label label-success'>AC</span>";
			}
			echo "</td>";
		}
		
		echo '</tr>';
	}
}



