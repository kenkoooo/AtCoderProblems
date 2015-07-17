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
			$dbh = null;
			return $stmt;
		} catch ( PDOException $e ) {
			print ('Error:' . $e->getMessage ()) ;
			die ();
		}
	}
	private function exectuteArray($querySet) {
		// クエリーセットを実行する
		// 返り値はない
		$dsn = 'mysql:dbname=LAA0348733-atcoder;host=mysql022.phy.lolipop.lan';
		
		try {
			$options = array (
					PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8' 
			);
			$dbh = new PDO ( $dsn, SQLUSER, SQLPASSWORD, $options );
			
			foreach ( $querySet as $query ) {
				$dbh->query ( $query );
			}
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
	
	// コンテスト一覧を引っ張ってくる
	public function pullOld() {
		$query = "SELECT contest_name FROM `submissions` WHERE exec =0 LIMIT 1";
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
	public function insertSubmission($id, $contest_name, $problem_name, $user, $time, $length, $exec) {
		$query = "SELECT * FROM submissions where id=$id";
		$data = $this->exectute ( $query );
		if (! $data->fetch ( PDO::FETCH_ASSOC )) {
			// 存在しない時
			$query = "INSERT INTO submissions (id,contest_name,problem_name,user,submission_time,length,exec) VALUES " . "($id,'$contest_name','$problem_name','$user','$time',$length,$exec)";
			$this->exectute ( $query );
		} else {
			// 存在する時
			$query = "UPDATE submissions SET length=$length,exec=$exec WHERE id=$id";
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
	
	// 全問題を取得する
	public function pullProblems() {
		$query = "SELECT problems.name as problem_name, problems.title, problems.solvers, contests.name as contest_name FROM problems LEFT JOIN contests ON problems.contest_id=contests.id";
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
	
	// ランキングを返す
	public function pullRanking() {
		$query = "SELECT count(DISTINCT(problem_name)), user FROM `submissions` GROUP BY user ORDER BY `count(distinct(problem_name))` DESC";
		return $this->exectute ( $query );
	}
	
	// ショートコーダーを返す
	private function getShortCoder($problem_name, $type) {
		// ショートコーダー $type="length"
		// 実行速度 $type="exec"
		
		// 問題に対するショートコーダーを返す
		$query = "SELECT * FROM submissions WHERE problem_name='$problem_name' ORDER BY `submissions`.`$type` ASC LIMIT 1";
		return $this->exectute ( $query );
	}
	
	// ショートコーダーを更新する
	public function updateShortCoder($type) {
		// ショートコーダー $type="length"
		// 実行速度 $type="exec"
		$table = "";
		if (strstr ( $type, "length" )) {
			$table = "short_coder";
		} else {
			$table = "exec_faster";
		}
		
		$short_coder = array ();
		$problems = $this->pullProblems ();
		foreach ( $problems as $p ) {
			array_push ( $short_coder, $p );
		}
		for($i = 0; $i < count ( $short_coder ); $i ++) {
			if ($short_coder [$i] ["solvers"] == 0) {
				continue;
			}
			$problem_name = $short_coder [$i] ["problem_name"];
			$submission = $this->getShortCoder ( $problem_name, $type );
			foreach ( $submission as $s ) {
				$short_coder [$i] ["submission"] = $s;
			}
		}
		
		$querySet = array ();
		foreach ( $short_coder as $s ) {
			if ($s ["solvers"] == 0) {
				continue;
			}
			$problem_name = $s ["problem_name"];
			$submission_id = $s ["submission"] ["id"];
			
			$query = "SELECT * FROM $table WHERE problem_name='$problem_name'";
			$data = $this->exectute ( $query );
			if (! $data->fetch ( PDO::FETCH_ASSOC )) {
				// 存在しない時
				$query = "INSERT INTO $table (problem_name,submission_id) VALUES " . "('$problem_name',$submission_id)";
				array_push ( $querySet, $query );
			} else {
				// 存在する時
				$query = "UPDATE $table SET submission_id=$submission_id WHERE problem_name='$problem_name'";
				array_push ( $querySet, $query );
			}
		}
		$this->exectuteArray ( $querySet );
	}
	
	// ショートコーダーを返す
	public function pullShorters($table) {
		$query = "SELECT * FROM problems LEFT JOIN $table ON problems.name=$table.problem_name LEFT JOIN submissions ON submissions.id=$table.submission_id WHERE problems.solvers>0";
		return $this->exectute ( $query );
	}
	
	// 問題を投げると、その問題を解いた人が解いた他の問題の人数を返す
	private function getEdgeScores($problem_name) {
		$query = "SELECT problem_name,COUNT(DISTINCT(user)) AS count FROM submissions WHERE submissions.user IN ( SELECT DISTINCT(user) FROM submissions WHERE problem_name='$problem_name' ) GROUP BY problem_name";
		return $this->exectute ( $query );
	}
	
	// ターゲットとなる問題番号（配列で何番目にあるか）から出るエッジを評価する
	public function scoreEdge($target) {
		$problems = $this->pullProblems ();
		$count = 0;
		$querySet = array ();
		foreach ( $problems as $p ) {
			if ($count != $target) {
				$count ++;
				continue;
			}
			
			$problem_name = $p ["problem_name"];
			$edges = $this->getEdgeScores ( $problem_name );
			foreach ( $edges as $e ) {
				$another_name = $e ["problem_name"];
				$score = $e ["count"];
				if (strstr ( $problem_name, $another_name )) {
					continue;
				}
				
				$query = "SELECT * FROM edges WHERE from_problem_name='$problem_name' AND to_problem_name='$another_name'";
				$data = $this->exectute ( $query );
				if (! $data->fetch ( PDO::FETCH_ASSOC )) {
					// 存在しない時
					$query = "INSERT INTO edges (from_problem_name,to_problem_name,score) VALUES " . "('$problem_name','$another_name',$score)";
					array_push ( $querySet, $query );
				} else {
					// 存在する時
					$query = "UPDATE edges SET score=$score WHERE from_problem_name='$problem_name' AND to_problem_name='$another_name'";
					array_push ( $querySet, $query );
				}
			}
			$count ++;
		}
		
		$this->exectuteArray ( $querySet );
	}
	
	//
	public function recommendEngine($user) {
		$query = "SELECT problems.name, contests.name, contests.title, problems.title, MAX( score ) max, problems.solvers FROM edges
LEFT JOIN problems ON to_problem_name = problems.name
LEFT JOIN contests ON contests.id = problems.contest_id
WHERE from_problem_name
IN (
SELECT DISTINCT (
problem_name
)
FROM submissions
WHERE user = '$user'
)
AND to_problem_name NOT
IN (

SELECT DISTINCT (
problem_name
)
FROM submissions
WHERE user = '$user'
)
AND solvers < (
SELECT AVG( top100.solvers )
FROM (

SELECT solvers
FROM problems
WHERE name
IN (

SELECT DISTINCT (
problem_name
)
FROM submissions
WHERE user = '$user' )
ORDER BY `problems`.`solvers` ASC
LIMIT 100
)top100
)
GROUP BY problems.name
ORDER BY max DESC
LIMIT 30";
		return $this->exectute ( $query );
	}
}