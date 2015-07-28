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
	$memberNum = $sql->getMemberNum ();
	
	$acNum = $sql->getACNum ( $user_name );
	$fastNum = $sql->getFastNum ( $user_name );
	$shortNum = $sql->getShortNum ( $user_name );
	
	$acRank = $sql->getMyPlace ( $user_name, 1 );
	$shortRank = $sql->getMyPlace ( $user_name, 2 );
	$fastRank = $sql->getMyPlace ( $user_name, 3 );
	
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

/*
 * レコメンドエンジン
 */
function listRecommend($user_name) {
	$sql = new SQLConnect ();
	// レコメンドエンジン
	$pull = $sql->recommendEngine ( $user_name );
	$evaluate = $sql->evaluateUser ( $user_name );
	$array = array ();
	foreach ( $pull as $r ) {
		$solvers = $r ["solvers"] + 0.0;
		if ($solvers < $evaluate) {
			array_push ( $array, $r );
		}
	}
	
	$limit = 20;
	
	$rand = rand ( 0, min ( count ( $array ), $limit ) - 1 );
	
	if (count ( $array ) > 0) {
		// ガチャ表示
		echo '<div class="container"><div class="page-header"><h1>ガチャ</h1>';
		echo '</div>';
		echo '<p class="lead">';
		$contest_name = $array [$rand] ["contest_name"];
		$contest_title = $array [$rand] ["contest_title"];
		$problem_name = $array [$rand] ["problem_name"];
		$problem_title = $array [$rand] ["problem_title"];
		echo "<a href='http://$contest_name.contest.atcoder.jp/tasks/$problem_name' target='_blank'>";
		echo $problem_title;
		echo "</a></p> <p>(出典: <a href='http://$contest_name.contest.atcoder.jp/' target='_blank'>$contest_title</a>)</p>";
		
		echo '</div>';
	}
	
	// レコメンド
	echo '<div class="container">';
	echo '<div class="page-header">
			<h1>おすすめ問題</h1>
		</div>';
	if (count ( $array ) == 0) {
		echo "<p>解いた問題が少なすぎるみたいです。AtCoder Beginner ContestのA問題・B問題あたりにチャレンジしてみてください。（開発中の機能につき、不十分な実装で申し訳ありません……）</p>";
		echo "</div>";
		return;
	}
	echo '<table id="recommend" class="table table-hover table-striped table-bordered table-condensed">';
	echo '<thead><tr>';
	echo '<th>問題名</th>';
	echo '<th>コンテスト</th>';
	echo '<th>解いた人数</th>';
	echo '<th>おすすめ度</th>';
	echo '</tr></thead>';
	echo '<tbody>';
	
	foreach ( $array as $problem ) {
		$contest_name = $problem ["contest_name"];
		$contest_title = $problem ["contest_title"];
		$problem_name = $problem ["problem_name"];
		$problem_title = $problem ["problem_title"];
		$solvers = $problem ["solvers"];
		$max = $problem ["max"];
		
		echo "<tr>";
		echo "<td><a href='http://$contest_name.contest.atcoder.jp/tasks/$problem_name' target='_blank'>";
		echo mb_strimwidth ( $problem_title, 0, 40, "...", "UTF-8" );
		echo "</a></td>";
		echo "<td><a href='http://$contest_name.contest.atcoder.jp/' target='_blank'>";
		echo mb_strimwidth ( $contest_title, 0, 40, "...", "UTF-8" );
		echo "</a></td>";
		echo "<td>";
		echo "<div class='text-right'><a href='http://$contest_name.contest.atcoder.jp/submissions/all?task_screen_name=$problem_name&status=AC' target='_blank'>";
		echo str_pad ( $solvers, 4, "0", STR_PAD_LEFT );
		echo "</a></div></td>";
		echo "<td>$max</td>";
		echo "</tr>";
		
		$limit --;
		if ($limit == 0) {
			break;
		}
	}
	
	echo '</tbody>';
	echo '</table>';
	echo '</div>';
}

// ライバルたちを表示する
function searchRivals($user_name) {
	$sql = new SQLConnect ();
	echo '<div class="container">';
	echo '<div class="page-header"><h1>ライバル</h1></div>';
	
	$evaluate = $sql->evaluateUser ( $user_name );
	$rivals = $sql->searchRivals ( $evaluate );
	
	foreach ( $rivals as $user ) {
		if (! stristr ( $user_name, $user ["user"] )) {
			echo "<a href='./user.php?name=" . $user ['user'] . "' target='_blank' class='btn btn-link btn-md' role='button' style='margin: 1px;'>" . $user ['user'] . "</a>";
		}
	}
	
	echo '</div>';
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