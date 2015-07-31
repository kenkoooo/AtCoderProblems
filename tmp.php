<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$time_start = microtime ( true );

$sql = new SQLConnect ();

echo "aaaaaaa";
$query = "SELECT * FROM problems ORDER BY id DESC";
$data = $sql->pullFirstRanking ();
$cnt = 0;
foreach ( $data as $s ) {
	var_dump ( $s );
	$cnt ++;
	if ($cnt == 2) {
		break;
	}
}