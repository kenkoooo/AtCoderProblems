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

$rivals = "";
if (isset ( $_GET ["rivals"] ) && preg_match ( '/^[\w\,]+$/', $_GET ["rivals"] )) {
	$rivals = $_GET ["rivals"];
} else {
	$rivals = "";
}

// ログ更新
$sql = new SQLConnect ();

if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"]) {
	$ranking = array ();
	$r = $sql->pullRanking ();
	foreach ( $r as $ranking_row ) {
		array_push ( $ranking, $ranking_row );
	}
} else {
	// 問題一覧取得
	$sql->insertLog ( $user_name, str_replace ( ',', ' ', $rivals ) );
	$problemArray = getProblemArray ( $user_name, $rivals );
}

// 表示
include 'view/html.inc';

// コンテストの問題を返す
function getProblemArray($user_name, $rivals) {
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
	
	return $array;
}

/*
 * リストモード
 */
function listMode($array) {
	echo '<div class="container">';
	echo '<table id="list" class="table table-hover table-striped table-bordered table-condensed">';
	echo '<thead><tr>';
	echo '<th>問題名</th>';
	echo '<th>コンテスト</th>';
	echo '<th>状態</th>';
	echo '<th>日付</th>';
	echo '<th>解いた人数</th>';
	echo '</tr></thead>';
	echo '<tbody>';
	
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["problem_name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<tr ";
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			} elseif ($contest_problem ["rival_solved"]) {
				echo "class='danger'";
			}
			echo ">";
			
			echo "<td><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name' target='_blank'>";
			echo mb_strimwidth ( $contest_problem_title, 0, 40, "...", "UTF-8" );
			echo "</a></td>";
			
			echo "<td><a href='http://$contest_name.contest.atcoder.jp/' target='_blank'>";
			echo "$contest_title";
			echo "</a></td>";
			
			echo "<td>";
			if ($contest_problem ["solved"]) {
				echo '<div class="text-center"><span class="label label-success">AC</span></div>';
			} elseif ($contest_problem ["rival_solved"]) {
				$rivals_array = array_unique ( explode ( ',', $contest_problem ["rivals"] ) );
				foreach ( $rivals_array as $rival_name ) {
					echo '<div class="text-center"><span class="label label-danger">' . $rival_name . '</span></div>';
				}
			}
			echo "</td>";
			
			echo "<td>";
			echo date ( "Y-m-d", strtotime ( $contest ["end"] ) );
			echo "</td>";
			
			echo "<td>";
			echo "<div class='text-right'><a href='http://$contest_name.contest.atcoder.jp/submissions/all?task_screen_name=$contest_problem_name&status=AC' target='_blank'>";
			// echo $contest_problem ["solvers"];
			// 4桁まで0埋め
			echo str_pad ( $contest_problem ["solvers"], 4, "0", STR_PAD_LEFT );
			echo "</a></div></td>";
			
			echo "</tr>";
		}
	}
	echo '</tbody>';
	echo '</table>';
	echo '</div>';
}
/*
 * ランキング表示モード
 */
function listRanking($array) {
	echo '<div class="container">';
	echo '<table id="ranking" class="table table-hover table-striped table-bordered table-condensed">';
	echo '<thead><tr>';
	echo '<th>順位</th>';
	echo '<th>AC数</th>';
	echo '<th>ユーザー名</th>';
	echo '</tr></thead>';
	echo '<tbody>';
	
	$rank = 1;
	foreach ( $array as $key => $user ) {
		$user_name = $user ["user"];
		$solves = $user [0];
		
		if ($solves != $array [$rank - 1] [0]) {
			$rank = $key + 1;
		}
		if ($rank > 1000) {
			break;
		}
		
		echo "<tr>";
		echo "<td>$rank</td>";
		echo "<td>$solves</td>";
		echo "<td><a href='./index.php?name=$user_name' target='_blank'>$user_name</a></td>";
		echo "</tr>";
	}
	echo '</tbody>';
	echo '</table>';
	echo '</div>';
}

/*
 * カテゴリ表示モード
 */
function listABC($array, $pattern) {
	echo '<div class="container">';
	echo '<div class="page-header"><h1>AtCoder ';
	if (preg_match ( $pattern, 'abc001' )) {
		echo 'Beginner';
	} else {
		echo 'Regular';
	}
	echo ' Contest</h1></div>';
	echo '<table id="category" class="table table-hover table-striped table-bordered table-condensed">';
	echo '<thead><tr>';
	echo '<th>コンテスト</th>';
	echo '<th>A問題</th>';
	echo '<th>B問題</th>';
	echo '<th>C問題</th>';
	echo '<th>D問題</th>';
	echo '</tr></thead>';
	echo '<tbody>';
	
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		if (! preg_match ( $pattern, $contest_name )) {
			continue;
		}
		
		echo "<tr>";
		echo "<td><a href='http://$contest_name.contest.atcoder.jp/' target='_blank'>";
		echo strtoupper ( $contest_name );
		echo "</a></td>";
		
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["problem_name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<td ";
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			} elseif ($contest_problem ["rival_solved"]) {
				echo "class='danger'";
			}
			echo "><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name' target='_blank'>";
			echo mb_strimwidth ( $contest_problem_title, 0, 30, "...", "UTF-8" );
			echo "</a></td>";
		}
		echo "</tr>";
	}
	echo '</tbody>';
	echo '</table>';
	echo '</div>';
}
function listOther($array) {
	echo '<div class="container">';
	echo '<div class="page-header"><h1>その他のコンテスト</h1></div>';
	
	foreach ( $array as $contest ) {
		if (! array_key_exists ( "problems", $contest )) {
			// 問題が存在しなければスルー
			continue;
		}
		
		$contest_name = $contest ["name"];
		$contest_title = $contest ["title"];
		
		if (! preg_match ( '/^(?!.*(abc|arc)).*$/', $contest_name )) {
			continue;
		}
		
		echo date ( "Y-m-d", strtotime ( $contest ["end"] ) ) . " ";
		echo "<strong><a href='http://$contest_name.contest.atcoder.jp/' target='_blank'>";
		echo $contest_title;
		echo "</a></strong>";
		
		echo '<table class="table table-hover table-striped table-bordered table-condensed">';
		echo '<tbody><tr>';
		foreach ( $contest ["problems"] as $contest_problem ) {
			$contest_problem_name = $contest_problem ["problem_name"];
			$contest_problem_title = $contest_problem ["title"];
			
			echo "<td ";
			if ($contest_problem ["solved"]) {
				echo "class='success'";
			} elseif ($contest_problem ["rival_solved"]) {
				echo "class='danger'";
			}
			echo "><a href='http://$contest_name.contest.atcoder.jp/tasks/$contest_problem_name' target='_blank'>";
			if ($contest_name === 'joisc2012') {
				echo mb_strimwidth ( $contest_problem_title, 0, 10, "...", "UTF-8" );
			} else {
				echo mb_strimwidth ( $contest_problem_title, 0, 30, "...", "UTF-8" );
			}
			echo "</a></td>";
		}
		echo "</tr>";
		echo '</tbody>';
		echo '</table>';
	}
	echo '</div>';
}


