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
	if ($mode * 40 > $contest_id || ($mode + 1) * 40 < $contest_id) {
		continue;
	}
	
	echo $name . "\n";
	
	// abcかarc以外ならスルー
	// if (! preg_match ( '/^(arc|abc)[0-9]*$/', $name )) {
	// continue;
	// }
	
	$url = "https://" . $name . ".contest.atcoder.jp/submissions/all/1?status=AC";
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
		$url = "https://" . $name . ".contest.atcoder.jp/submissions/all/" . $i . "?status=AC";
		echo $url . "\n";
		$html = file_get_html ( $url );
		
		$submission = 0;
		foreach ( $html->find ( "tr" ) as $element ) {
			$problem = "";
			$submission = 0;
			$time = "";
			$user = "";
			$language = "";
			$length = 0;
			$exec = 0;
			
			// 時間を記録
			foreach ( $element->find ( "time" ) as $links ) {
				$time = date ( "YmdHis", strtotime ( $links->plaintext ) );
			}
			
			// 長さを記録
			foreach ( $element->find ( ".table-nwb" ) as $nwb ) {
				if (preg_match ( '/[0-9]* Byte/', $nwb->plaintext )) {
					$length = str_replace ( " Byte", "", $nwb->plaintext );
					break;
				}
			}
			
			// 実行時間を記録
			foreach ( $element->find ( ".right" ) as $nwb ) {
				if (preg_match ( '/[0-9]* ms/', $nwb->plaintext )) {
					$exec = str_replace ( " ms", "", $nwb->plaintext );
					break;
				}
			}
			
			// リンクされている項目は拾いやすい
			foreach ( $element->find ( "a" ) as $links ) {
				// 問題ID
				if (strstr ( $links->href, '/tasks/' )) {
					$problem = preg_replace ( '/^\\/tasks\\//', '$1', $links->href );
				}
				// ユーザー
				if (strstr ( $links->href, '/users/' )) {
					$user = preg_replace ( '/^\\/users\\//', '$1', $links->href );
				}
				//
				if (preg_match ( '/submissions\\/[0-9]+/', $links->href )) {
					$submission = preg_replace ( '/^\\/submissions\\//', '$1', $links->href );
				}
			}
			
			if ($submission <= 0) {
				continue;
			}
			
			$sql->insertSubmission ( $submission, $name, $problem, $user, $time, $length, $exec );
		}
		
		$html->clear ();
		if ($past >= $submission) {
			// 追いついたら終了
			break;
		}
	}
	// コンテスト終わり
}
