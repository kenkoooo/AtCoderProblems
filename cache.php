<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$time_start = microtime ( true );

echo 'starting scoring user...' . "\n";
scoreUser ( $sql );
$timelimit = microtime ( true ) - $time_start;
echo $timelimit . ' seconds' . "\n";

echo 'starting logging faster...' . "\n";
execFaster ( $sql );
$timelimit = microtime ( true ) - $time_start;
echo $timelimit . ' seconds' . "\n";

echo 'starting scoring edges...' . "\n";
// scoreEdge ( $sql );
$timelimit = microtime ( true ) - $time_start;
echo $timelimit . ' seconds' . "\n";

// ユーザー評価をキャッシュする
function scoreUser() {
	$sql = new SQLConnect ();
	// 1ヶ月以内にACのあったユーザーの一覧を取得する
	$query = "SELECT user FROM submissions WHERE submission_time >= DATE_ADD(NOW(), INTERVAL -1 MONTH) GROUP BY user";
	$r = $sql->exectute ( $query );
	
	$querySet = array ();
	foreach ( $r as $user ) {
		$user_name = $user ["user"];
		$acNum = $sql->getACNum ( $user_name ); // AC数を取ってくる
		
		if ($acNum > 30) {
			$evaluate = round ( $sql->evaluateUser ( $user_name ) );
			
			$query = "INSERT INTO evaluate (user,evaluate) VALUES ('$user_name',$evaluate) ON DUPLICATE KEY UPDATE evaluate=$evaluate";
			array_push ( $querySet, $query );
		}
	}
	
	$sql->exectuteArray ( $querySet );
}
function scoreEdge() {
	$sql = new SQLConnect ();
	$hour = date ( "H" );
	$minute = date ( "i" );
	$time = 60 * $hour + $minute;
	
	$sql->scoreEdge ( $time );
}
function execFaster() {
	$sql = new SQLConnect ();
	$mode = date ( "i" ) / 10;
	$mode = 0;
	
	if ($mode == 0) {
		$sql->updateShortCoder ( "exec" );
	} elseif ($mode == 1) {
		$sql->updateShortCoder ( "length" );
	} elseif ($mode == 2) {
		$sql->updateShortCoder ( "id" );
	}
}