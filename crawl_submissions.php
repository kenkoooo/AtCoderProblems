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
	echo $name . "\n";
	// // 今回はARCとABCだけクロール
	if (! preg_match ( '/^(arc|abc)[0-9]*$/', $name )) {
		continue;
	}
	
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
	$maxsub = 0;
	foreach ( $html->find ( "tr" ) as $element ) {
		foreach ( $element->find ( "a" ) as $links ) {
			if (preg_match ( '/submissions\\/[0-9]+/', $links->href )) {
				$submission = preg_replace ( '/^\\/submissions\\//', '$1', $links->href );
				$maxsub = max ( $maxsub, $submission );
			}
		}
	}
	
	$html->clear ();
	$past = $sql->checkPastCrawl ( $name );
	if ($past >= $maxsub) {
		continue;
	}
	
	for($i = 1; $i <= $max; $i ++) {
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
		if ($past >= $submission) {
			// 追いついたら終了
			break;
		}
	}
}
