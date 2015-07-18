<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();

$time_start = microtime ( true );
for($i = 607; $i < 830; $i ++) {
	echo $i . " ";
	$sql->scoreEdge ( $i );
}

$timelimit = microtime ( true ) - $time_start;
echo $timelimit . ' seconds' . "\n";