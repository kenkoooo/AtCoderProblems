<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();

$time_start = microtime ( true );
$sql->cacheEvaluate ();
$timelimit = microtime ( true ) - $time_start;
echo $timelimit . ' seconds' . "\n";