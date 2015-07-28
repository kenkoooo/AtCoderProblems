<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$time_start = microtime ( true );
scoreEdge ( $sql );
scoreUser ( $sql );
execFaster ( $sql );

$timelimit = microtime ( true ) - $time_start;
echo $timelimit . ' seconds' . "\n";

// ユーザー評価をキャッシュする
function scoreUser($sql) {
	$sql->cacheEvaluate ();
}
function scoreEdge($sql) {
	$hour = date ( "H" );
	$minute = date ( "i" );
	$time = 60 * $hour + $minute;
	
	$sql->scoreEdge ( $time );
}
function execFaster($sql) {
	$mode = date ( "i" ) % 10;
	
	if ($mode == 0) {
		$sql->updateShortCoder ( "exec" );
	} else {
		$sql->updateShortCoder ( "length" );
	}
}