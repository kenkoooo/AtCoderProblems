<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$mode = date ( "i" ) % 10;

$sql = new SQLConnect ();

if ($mode == 0) {
	$sql->updateShortCoder ( "exec" );
} else {
	$sql->updateShortCoder ( "length" );
}

