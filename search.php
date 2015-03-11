<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$pull = $sql->pullContests ();

$array = array ();
foreach ( $pull as $element ) {
	$name = $element ["name"];
	if (preg_match ( '/(abc|arc)[0-9]*/i', $element ["name"] )) {
		array_push ( $array, $element );
	}
}

// 列nameでソートしたい
foreach ( $array as $key => $row ) {
	$n [$key] = $row ["name"];
}

array_multisort ( $n, SORT_ASC, $array );

echo '<pre>';
var_dump ( $array );
echo '</pre>';