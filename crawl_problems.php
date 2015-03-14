<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();

$contests = $sql->pullContests ();
foreach ( $contests as $c ) {
	$contest_id = $c ["id"];
	$name = $c ["name"];
	$end = $c ["end"];
	if (strtotime ( "now" ) <= strtotime ( $end )) {
		// コンテストが終わっていない時はスルー
		continue;
	}
	
	if ($sql->isProblemExisting ( $contest_id )) {
		echo $name . "\n";
		// 既に問題が存在する時はスルー
		continue;
	}
	
	$url = "http://" . $name . ".contest.atcoder.jp/assignments";
	$html = file_get_html ( $url );
	
	$title = "";
	$cnt = 0;
	foreach ( $html->find ( "td a" ) as $element ) {
		if (preg_match ( '/^\\/task/i', $element->href )) {
			$title = $title . $element->plaintext;
			
			if ($cnt % 2 == 0) {
				$title = $title . ". ";
			} else {
				$pname = preg_replace ( '/^\\/tasks\\//i', '', $element->href );
				$sql->insertProblem ( $contest_id, $pname, $title );
				$title = "";
			}
			$cnt ++;
		}
	}
}
