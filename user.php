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
	$acNum = $sql->getACNum ( $user_name );
	$fastNum = $sql->getFastNum ( $user_name );
	$shortNum = $sql->getShortNum ( $user_name );
}

// 表示
include 'view/user.inc';
