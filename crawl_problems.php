<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$name = "hbpc2012";
$url = "http://" . $name . ".contest.atcoder.jp/assignments";
$html = file_get_html ( $url );

// a要素のhref属性の抽出
foreach ( $html->find ( "td.center a" ) as $element ) {
	if (preg_match ( '/^\\/tasks/i', $element->href )) {
		print $element->href . '<br>';
	}
}
