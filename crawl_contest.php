<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$pull = $sql->pullContests ();
foreach ( $pull as $element ) {
	$name = $element ["name"];
	$url = "http://" . $name . ".contest.atcoder.jp/";
	$html = file_get_html ( $url );
	
	$start = $html->find ( 'time#contest-start-time', 0 )->plaintext;
	$end = $html->find ( 'time#contest-end-time', 0 )->plaintext;
	$title = $html->find ( 'span.contest-name', 0 )->plaintext;
	
	if ($start == NULL) {
		$sql->updateContest ( $name, "", 0, 0, 0 );
	} else {
		$sql->updateContest ( $name, $title, 1, date ( "YmdHis", strtotime ( $start ) ), date ( "YmdHis", strtotime ( $end ) ) );
	}
}
