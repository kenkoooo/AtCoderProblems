<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$time_start = microtime ( true );

$sql = new SQLConnect ();
$contests = $sql->pullContests ();

$query = "SELECT * FROM edges";
$submissions = $sql->exectute ( $query );
$cnt = 0;
$array = array ();
foreach ( $submissions as $s ) {
	array_push ( $array, $s );
	$cnt ++;
	
	if ($cnt == 30)
		break;
}

var_dump ( $array );

$time_end = microtime ( true );
$time = $time_end - $time_start;

echo "$time 秒掛かりました。\n";