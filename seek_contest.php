<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$query = "SELECT * FROM contests";
$sql->exectute ( $query );