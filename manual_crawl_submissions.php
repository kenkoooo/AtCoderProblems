<?php
require_once 'simple_html_dom.php';
require_once 'sql.php';

$sql = new SQLConnect ();
$name = 'utpc2014';
$restart = 1;

// TODO
// 手動用スクリプト
// 緊急用
// return;

$url = "http://" . $name . ".contest.atcoder.jp/submissions/all/1?status=AC";
$html = file_get_html ( $url );

$max = 0;
foreach ( $html->find ( "div.pagination-centered" ) as $element ) {
	foreach ( $element->find ( "a" ) as $links ) {
		if (strstr ( $links->href, 'submissions/all' )) {
			$next = preg_replace ( '/^\\/submissions\\/all\\/([0-9]*)\\?status=AC/', '$1', $links->href );
			$max = max ( $max, $next );
		}
	}
}

$html->clear ();

for($i = $restart; $i <= $max; $i ++) {
	$url = "http://" . $name . ".contest.atcoder.jp/submissions/all/" . $i . "?status=AC";
	echo $url . "\n";
	$html = file_get_html ( $url );
	
	$submission = 0;
	foreach ( $html->find ( "tr" ) as $element ) {
		$problem = "";
		$submission = 0;
		$time = "";
		$user = "";
		foreach ( $element->find ( "time" ) as $links ) {
			$time = date ( "YmdHis", strtotime ( $links->plaintext ) );
		}
		foreach ( $element->find ( "a" ) as $links ) {
			if (strstr ( $links->href, '/tasks/' )) {
				$problem = preg_replace ( '/^\\/tasks\\//', '$1', $links->href );
			}
			if (strstr ( $links->href, '/users/' )) {
				$user = preg_replace ( '/^\\/users\\//', '$1', $links->href );
			}
			if (preg_match ( '/submissions\\/[0-9]+/', $links->href )) {
				$submission = preg_replace ( '/^\\/submissions\\//', '$1', $links->href );
			}
		}
		
		if ($submission <= 0) {
			continue;
		}
		
		$sql->insertSubmission ( $submission, $name, $problem, $user, $time );
	}
	
	$html->clear ();
}

// TODO
// 1コンテストずつクロールする
echo 'finished' . "\n";