<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$html = file_get_html ( 'http://atcoder.jp/' );

// a要素のhref属性の抽出
foreach ( $html->find ( a ) as $element ) {
	if (preg_match ( '/contest\\.atcoder\\.jp/i', $element->href )) {
		$url = $element->href;
		$name = preg_replace ( '/http:\\/\\/([a-z0-9_\\-]*)\\.contest\\.atcoder\\.jp.*/i', '$1', $url );
		$sql->insertContest ( $name );
	}
}
