<?php
class SQLConnect {
	public function exectute($sql) {
		$dsn = 'mysql:dbname=LAA0348733-atcoder;host=mysql022.phy.lolipop.lan';
		$user = 'LAA0348733';
		$password = 'escherichia';
		
		try {
			$dbh = new PDO ( $dsn, $user, $password );
			
			print ('接続に成功しました。<br>') ;
			
			$dbh->query ( 'SET NAMES sjis' );
			
			echo $sql;
			
			foreach ( $dbh->query ( $sql ) as $row ) {
				print ($row ['id']) ;
				print ($row ['name'] . '<br>') ;
			}
		} catch ( PDOException $e ) {
			print ('Error:' . $e->getMessage ()) ;
			die ();
		}
		
		$dbh = null;
	}
}