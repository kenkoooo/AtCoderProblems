<?php
require_once 'sql_config.php';
class SQLConnect {
	private function exectute($sql) {
		$dsn = 'mysql:dbname=LAA0348733-atcoder;host=mysql022.phy.lolipop.lan';
		
		try {
			$options = array (
					PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8' 
			);
			$dbh = new PDO ( $dsn, SQLUSER, SQLPASSWORD, $options );
			
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
	
	// 提出最新を引っ張ってくる
	public function pullSubmissions($contest_name) {
		$query = "SELECT * FROM submissions WHERE contest_name = '$contest_name' ORDER BY submission_time DESC LIMIT 20";
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
	
	// サブミッションを追加してくれる
	public function insertSubmission($id, $contest_name, $problem_name, $user, $time) {
		$query = "SELECT * FROM submissions where id=$id";
		$data = $this->exectute ( $query );
		if (! $data->fetch ( PDO::FETCH_ASSOC )) {
			// 存在しない時
			$query = "INSERT INTO submissions (id,contest_name,problem_name,user,submission_time) VALUES " . "($id,'$contest_name','$problem_name','$user','$time')";
			$this->exectute ( $query );
		}
	}
	
	// 直近のクロールを確認する。submissionsのidを返す
	public function checkPastCrawl($contest_name) {
		$query = "SELECT id FROM submissions where contest_name='$contest_name' ORDER BY id DESC";
		$data = $this->exectute ( $query );
		$row = $data->fetch ( PDO::FETCH_ASSOC );
		if (! $row) {
			// 存在しない時
			return 0;
		} else {
			return $row ["id"];
		}
	}
	
	// コンテストIDから問題を取得する
	public function getProblems($contest_id) {
		$query = "SELECT * FROM problems WHERE contest_id=$contest_id";
		return $this->exectute ( $query );
	}
	
	// 正解状況を確認する
	public function getSolved($user) {
		$query = "SELECT * FROM submissions where user='$user'";
		return $this->exectute ( $query );
	}
	
	// 正解者数を返す
	public function getNumSolvers() {
		$query = "SELECT count( DISTINCT (user) ) as solvers, problem_name FROM submissions GROUP BY problem_name";
		return $this->exectute ( $query );
	}
	
	// 正解者数を更新する
	public function updateSolvers($solvers, $problem_name) {
		$query = "UPDATE problems SET solvers = $solvers WHERE name ='$problem_name'";
		$this->exectute ( $query );
	}
	
	// ログを更新する
	public function insertLog($user_name, $list_mode) {
		$query = "INSERT INTO log(user, mode) VALUES ('$user_name',$list_mode)";
		$this->exectute ( $query );
	}
}