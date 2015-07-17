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

$exist = $sql->isExist ( $user_name );
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
}

// 表示
include 'view/user.inc';
