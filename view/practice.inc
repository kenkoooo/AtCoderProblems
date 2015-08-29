<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="">
<meta name="author" content="">
<link rel="icon" href="../../favicon.ico">

<title>AtCoder Problems</title>

<!-- Bootstrap core CSS -->
<link href="css/bootstrap.min.css" rel="stylesheet">
<!-- Bootstrap theme -->
<link href="css/bootstrap-theme.min.css" rel="stylesheet">
<link href="css/dataTables.bootstrap.css" rel="stylesheet">

<!-- Custom styles for this template -->
<link href="theme.css" rel="stylesheet">


<!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
<!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-60720107-1', 'auto');
  ga('send', 'pageview');

</script>
</head>

<body role="document">
	<!-- Fixed navbar -->
	<nav class="navbar navbar-inverse navbar-fixed-top">
		<div class="container">
			<div class="navbar-header">
				<button type="button" class="navbar-toggle collapsed"
					data-toggle="collapse" data-target="#navbar" aria-expanded="false"
					aria-controls="navbar">
					<span class="sr-only">Toggle navigation</span> <span
						class="icon-bar"></span> <span class="icon-bar"></span> <span
						class="icon-bar"></span>
				</button>
				<span class="navbar-brand"><a href="./practice.php">AtCoderのACが割と早めに反映される練習会専用システム</a></span>
			</div>
		</div>
	</nav>
	<div class="lead">
		<ul>
			<li><a href="https://atnd.org/events/69057" target=_blank>イベントサイトはこちら</a></li>
			<li><a href="http://goo.gl/forms/tU4Plq8TSU" target=_blank>アンケート</a>にご回答ください！</li>
		</ul>


		<form action="practice.php" method="get" class="form-inline">
			<div class="form-group">
				<label>ユーザー絞り込み（カンマ区切り） </label>
					<?php echo '<input type="text" class="form-control" style="width: 400px;" placeholder="User ID" name="search" value="' . $search . '">'; ?>
			</div>
			<div class="form-group" style="visibility: hidden; width: 0;">
					<?php echo '<input type="text" name="date" value="' . $date . '">'; ?>
			</div>
			<button type="submit" class="btn btn-default">Search</button>
		</form>
	</div>

	<!-- div class="container" style="visibility: hidden; height: 0;"-->
		<?php
		if (isset ( $_GET ["all"] )) {
		} else {
			listAC ( $problem_set, $user_data, 1, 1 );
			listAC ( $problem_set, $user_data, 2, 2 );
			listAC ( $problem_set, $user_data, 3, 3 );
			listAC ( $problem_set, $user_data, 4, 4 );
		}
		function listAC($problem_set, $user_data, $low, $high) {
			echo '<div>';
			
			if ($high <= 1) {
				echo '<div class="page-header"><h1>Aレベル問題</h1></div>';
			} else if ($high <= 2) {
				echo '<div class="page-header"><h1>Bレベル問題</h1></div>';
			} else if ($high <= 3) {
				echo '<div class="page-header"><h1>Cレベル問題</h1></div>';
			} else {
				echo '<div class="page-header"><h1>Dレベル問題</h1></div>';
			}
			
			echo '<table class="table table-hover table-striped table-bordered table-condensed">';
			echo '<thead><tr>';
			echo '<th>タイトル</th>';
			
			foreach ( $problem_set as $set ) {
				$title = $set ["title"];
				$contest_name = $set ["contest_name"];
				$problem_name = $set ["problem_name"];
				$level = $set ["level"];
				if ($level < $low || $high < $level) {
					continue;
				}
				
				echo "<th><a href='http://$contest_name.contest.atcoder.jp/tasks/$problem_name' target=_blank>$title</a></th>";
			}
			echo '</tr>';
			
			echo '<tr>';
			echo '<th>解いた人の数</th>';
			foreach ( $problem_set as $set ) {
				$level = $set ["level"];
				if ($level < $low || $high < $level) {
					continue;
				}
				
				// 解いた人数を出すだけのプロセス
				$cnt = 0;
				foreach ( $user_data as $user_name => $solves ) {
					$problem_name = $set ["problem_name"];
					if ($solves [$problem_name]) {
						$cnt ++;
					}
				}
				echo "<th>$cnt</th>";
			}
			echo '</tr>';
			echo '</thead>';
			echo '<tbody>';
			
			foreach ( $user_data as $user_name => $solves ) {
				echo "<tr>";
				echo "<td>" . $user_data [$user_name] ["screen_name"] . "</td>";
				foreach ( $problem_set as $set ) {
					$level = $set ["level"];
					if ($level < $low || $high < $level) {
						continue;
					}
					$problem_name = $set ["problem_name"];
					echo "<td>";
					if ($solves [$problem_name]) {
						echo '<div class="text-center"><span class="label label-success">AC</span></div>';
					}
					echo "</td>";
				}
				echo "</tr>";
			}
			
			echo '</tbody>';
			echo '</table>';
			echo '</div>';
		}
		?>

	<!-- /container -->


	<!-- Bootstrap core JavaScript
    ================================================== -->
	<!-- Placed at the end of the document so the pages load faster -->
	<script
		src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
	<script src="js/bootstrap.min.js"></script>
	<script src="js/dataTables.bootstrap.js"></script>
	<script src="js/jquery.dataTables.min.js"></script>
	<script type="text/javascript">

	$(document).ready(function() {
	    $('#list').dataTable({
	        "bPaginate": false,
	        "bLengthChange": false,
	        "bFilter": true,
	        "bInfo": false,
	        "bAutoWidth": false,
			"aaSorting": [[ 3, "asc" ]]
	      });
	} );
	
	</script>
</body>
</html>
