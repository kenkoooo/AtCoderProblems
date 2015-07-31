<?php
require_once 'sql_config.php';
class SQLConnect {
	public function exectute($sql) {
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
	public function exectuteArray($querySet) {
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
	
	// 問題を追加してくれる
	public function insertProblem($contest_id, $name, $title) {
		$query = "SELECT * FROM problems WHERE name='$name'";
		$data = $this->exectute ( $query );
		if (! $data->fetch ( PDO::FETCH_ASSOC )) {
			// 存在しない時
			$query = "INSERT INTO problems (contest_id,name,title) VALUES ($contest_id,'$name','$title')";
			$this->exectute ( $query );
			
			$query = "SELECT * FROM problem WHERE name='$name'";
			$data = $this->exectute ( $query );
			foreach ( $data as $p ) {
				$problem_id = $p ["id"];
			}
			
			$query = "INSERT INTO fa_user (problem_id) VALUES ($problem_id)";
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
		$query = "SELECT
				p.id AS problem_id,
				p.name AS problem_name,
				p.title,
				p.solvers,
				contests.name as contest_name,
				sh.length, sh.user AS short, sh.id AS short_id,
				ex.exec, ex.user AS fast, ex.id AS fast_id,
				fa.user AS first_user, fa.id AS first_id
FROM problems AS p
LEFT JOIN contests ON p.contest_id=contests.id
LEFT JOIN submissions AS fa ON fa.id=p.fa_user
LEFT JOIN submissions AS sh ON sh.id=p.short_coder
LEFT JOIN submissions AS ex ON ex.id=p.exec_faster";
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
	
	// ACランキングを返す
	public function pullRanking() {
		$query = "SELECT count(DISTINCT(problem_name)), user FROM `submissions` GROUP BY user ORDER BY `count(distinct(problem_name))` DESC";
		return $this->exectute ( $query );
	}
	
	// ショートコーダーランキングを返す
	public function pullShortRanking() {
		$query = "SELECT
				COUNT(DISTINCT(submissions.problem_name)),user FROM problems LEFT JOIN submissions ON submissions.id=problems.short_coder GROUP BY user ORDER BY `COUNT(DISTINCT(submissions.problem_name))`  DESC";
		return $this->exectute ( $query );
	}
	
	// ユーザーが存在するかどうか
	public function isExist($user_name) {
		$query = "SELECT * FROM submissions WHERE user='$user_name'";
		$data = $this->exectute ( $query );
		if (! $data->fetch ( PDO::FETCH_ASSOC )) {
			// 存在しない時
			return FALSE;
		} else {
			// 存在する時
			return TRUE;
		}
	}
	
	// 条件に合う問題数を返す
	public function likeProblemNum($like) {
		$query = "SELECT COUNT(DISTINCT(name)) AS count FROM problems WHERE name LIKE '$like'";
		$count = 0;
		$data = $this->exectute ( $query );
		foreach ( $data as $d ) {
			$count = max ( $count, $d ["count"] );
		}
		return $count;
	}
	
	// 条件に合うAC数を返す
	public function likeACNum($user_name, $like) {
		$query = "SELECT COUNT(DISTINCT(problem_name)) AS count FROM submissions WHERE  user='$user_name' AND problem_name LIKE '$like'";
		$count = 0;
		$data = $this->exectute ( $query );
		foreach ( $data as $d ) {
			$count = max ( $count, $d ["count"] );
		}
		return $count;
	}
	
	// 全問題数を返す
	public function getProblemNum() {
		$query = "SELECT COUNT(name) AS count FROM problems";
		$count = 0;
		$data = $this->exectute ( $query );
		foreach ( $data as $d ) {
			$count = max ( $count, $d ["count"] );
		}
		return $count;
	}
	
	// 正解問題数を返す
	public function getACNum($user_name) {
		$query = "SELECT count(DISTINCT(problem_name)) AS count FROM submissions WHERE user='$user_name' GROUP BY user";
		$count = 0;
		$data = $this->exectute ( $query );
		foreach ( $data as $d ) {
			$count = max ( $count, $d ["count"] );
		}
		return $count;
	}
	
	// ファストランキングを返す
	public function pullFastRanking() {
		$query = "SELECT 
				COUNT(DISTINCT(submissions.problem_name)),user 
				FROM problems 
				LEFT JOIN submissions ON submissions.id=problems.exec_faster 
				GROUP BY user ORDER BY `COUNT(DISTINCT(submissions.problem_name))` DESC";
		return $this->exectute ( $query );
	}
	
	// FAランキングを返す
	public function pullFirstRanking() {
		$query = "SELECT
					COUNT(DISTINCT(submissions.problem_name)),user 
				FROM problems
				LEFT JOIN submissions ON submissions.id=problems.fa_user 
				GROUP BY user ORDER BY `COUNT(DISTINCT(submissions.problem_name))` DESC";
		return $this->exectute ( $query );
	}
	
	// ショートコーダーを返す
	private function getShortCoder($problem_id, $type) {
		// ショートコーダー $type="length"
		// 実行速度 $type="exec"
		
		// 問題に対するショートコーダーを返す
		$query = "SELECT * FROM submissions WHERE problem_id=$problem_id ORDER BY `submissions`.`$type` ASC LIMIT 1";
		return $this->exectute ( $query );
	}
	
	// ショートコーダーを更新する
	public function updateShortCoder($type) {
		// ショートコーダー $type="length"
		// 実行速度 $type="exec"
		// First Acceptance $type="id"
		$short_coder = array ();
		$problems = $this->pullProblems ();
		foreach ( $problems as $p ) {
			array_push ( $short_coder, $p );
		}
		for($i = 0; $i < count ( $short_coder ); $i ++) {
			if ($short_coder [$i] ["solvers"] == 0) {
				continue;
			}
			$problem_id = $short_coder [$i] ["problem_id"];
			$submission = $this->getShortCoder ( $problem_id, $type );
			foreach ( $submission as $s ) {
				$short_coder [$i] ["submission"] = $s;
			}
		}
		
		if (strstr ( $type, "id" )) {
			$type = "fa_user";
		} elseif (strstr ( $type, "length" )) {
			$type = "short_coder";
		} elseif (strstr ( $type, "exec" )) {
			$type = "exec_faster";
		}
		
		$querySet = array ();
		foreach ( $short_coder as $s ) {
			if ($s ["solvers"] == 0) {
				continue;
			}
			$problem_id = $s ["problem_id"];
			$submission_id = $s ["submission"] ["id"];
			
			$query = "UPDATE problems SET $type=$submission_id WHERE id=$problem_id";
			array_push ( $querySet, $query );
		}
		$this->exectuteArray ( $querySet );
	}
	
	// ショートコーダーを返す
	public function pullShorters($table) {
		$query = "SELECT * FROM problems LEFT JOIN $table ON problems.name=$table.problem_name LEFT JOIN submissions ON submissions.id=$table.submission_id WHERE problems.solvers>0";
		return $this->exectute ( $query );
	}
	
	// 問題を投げると、その問題を解いた人が解いた他の問題の人数を返す
	private function getEdgeScores($problem_id) {
		$query = "SELECT problem_id,COUNT(DISTINCT(user)) AS count FROM submissions WHERE submissions.user IN ( SELECT DISTINCT(user) FROM submissions WHERE problem_id=$problem_id ) GROUP BY problem_id";
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
			
			$problem_id = $p ["problem_id"];
			$edges = $this->getEdgeScores ( $problem_id );
			foreach ( $edges as $e ) {
				$another_id = $e ["problem_id"];
				echo $another_id . "\n";
				$score = $e ["count"];
				if (strstr ( $problem_id, $another_id )) {
					continue;
				}
				
				$query = "SELECT * FROM edges WHERE from_problem_id=$problem_id AND to_problem_id=$another_id";
				$data = $this->exectute ( $query );
				if (! $data->fetch ( PDO::FETCH_ASSOC )) {
					// 存在しない時
					$query = "INSERT INTO edges (from_problem_id,to_problem_id,score) VALUES " . "($problem_id , $another_id , $score)";
					array_push ( $querySet, $query );
				} else {
					// 存在する時
					$query = "UPDATE edges SET score=$score WHERE from_problem_id=$problem_id AND to_problem_id=$another_id";
					array_push ( $querySet, $query );
				}
			}
			$count ++;
		}
		
		$this->exectuteArray ( $querySet );
	}
	
	// ユーザー評価値の取得
	public function evaluateUser($user) {
		$query = "SELECT AVG( top100.solvers ) AS avg
FROM (

SELECT solvers
FROM problems
WHERE name
IN (

SELECT DISTINCT (
problem_name
)
FROM submissions
WHERE user = '$user'
)
ORDER BY problems.solvers ASC
LIMIT 30
)top100";
		$data = $this->exectute ( $query );
		$ret = 10000;
		foreach ( $data as $value ) {
			$ret = min ( $value ["avg"] + 0.0, $ret );
		}
		return $ret * 1.2;
	}
	
	// レコメンドエンジン
	public function recommendEngine($user) {
		$query = "SELECT problems.name AS problem_name, contests.name AS contest_name, contests.title AS contest_title, problems.title AS problem_title, MAX( score ) AS max, problems.solvers FROM edges
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
GROUP BY problems.name
ORDER BY max DESC";
		return $this->exectute ( $query );
	}
	
	// ライバルを探す
	public function searchRivals($evaluate) {
		$range = 0.1;
		$floor = min ( $evaluate * (1.0 - $range), $evaluate - 20 );
		$ceil = max ( $evaluate * (1.0 + $range), $evaluate + 20 );
		$query = "SELECT user FROM evaluate WHERE evaluate>=$floor AND evaluate<=$ceil";
		return $this->exectute ( $query );
	}
}