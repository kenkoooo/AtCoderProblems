<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$sql->updateShortCoder ( "exec" );
