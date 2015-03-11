<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();

$contests = $sql->pullContests ();
foreach ( $contests as $c ) {
	$contest_id = $c ["id"];
	$name = $c ["name"];
	
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
