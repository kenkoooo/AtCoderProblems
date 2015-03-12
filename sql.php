<?php
class SQLConnect {
	private function exectute($sql) {
		$dsn = 'mysql:dbname=LAA0348733-atcoder;host=mysql022.phy.lolipop.lan';
		$user = 'LAA0348733';
		$password = 'escherichia';
		
		try {
			$options = array (
					PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8' 
			);
			$dbh = new PDO ( $dsn, $user, $password, $options );
			
			$stmt = $dbh->query ( $sql );
			
			return $stmt;
		} catch ( PDOException $e ) {
			print ('Error:' . $e->getMessage ()) ;
			die ();
		}
	}
	
	// コンテストを追加してくれる
	public function insertContest($name) {
		$query = "SELECT * FROM contests where name='$name'";
		$data = $this->exectute ( $query );
		if (! $data->fetch ( PDO::FETCH_ASSOC )) {
			$query = "INSERT INTO contests (name) VALUES ('$name')";
			$this->exectute ( $query );
		}
	}
	
	// コンテストの存在・開始時刻・終了時刻をアップデートする
	public function updateContest($name, $title, $bool, $start, $end) {
		$query = "UPDATE contests SET exist=$bool, title='$title', start=$start, end=$end WHERE name='$name'";
		$this->exectute ( $query );
	}
	
	// 該当するコンテストの問題はクロール済みかどうか
	public function isProblemExisting($contest_id) {
		$query = "SELECT * FROM problems where contest_id=$contest_id";
		$data = $this->exectute ( $query );
		if ($data->fetch ( PDO::FETCH_ASSOC )) {
			// 存在する時
			return TRUE;
		}
		return FALSE;
	}
	
	// コンテスト一覧を引っ張ってくる
	public function pullContests() {
		$query = "SELECT * FROM contests WHERE exist=1 ORDER BY contests.end ASC";
		return $this->exectute ( $query );
	}
	
	// コンテスト検索
	public function getContest($id) {
		$query = "SELECT name FROM contests WHERE id=$id";
		return $this->exectute ( $query );
	}
	
	// 問題を追加してくれる
	public function insertProblem($contest_id, $name, $title) {
		$query = "SELECT * FROM problems where name='$name'";
		$data = $this->exectute ( $query );
		if (! $data->fetch ( PDO::FETCH_ASSOC )) {
			// 存在しない時
			$query = "INSERT INTO problems (contest_id,name,title) VALUES ($contest_id,'$name','$title')";
			$this->exectute ( $query );
		}
	}
	
	// コンテストIDから問題を取得する
	public function getProblems($contest_id) {
		$query = "SELECT * FROM problems WHERE contest_id=$contest_id";
		return $this->exectute ( $query );
	}
}