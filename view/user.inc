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
<script src="./js/Chart.js"></script>
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
				<span class="navbar-brand">AtCoder Problems</span>
			</div>
			<?php include 'view/navbar.inc';?>
			<!--/.nav-collapse -->
		</div>
	</nav>
	<div class="container">
		<form action="user.php" method="get" class="form-inline">
			<div class="form-group">
				<label>User ID:</label>
					<?php echo '<input type="text" class="form-control" id="exampleInputEmail1" placeholder="User ID" name="name" value="' . $user_name . '">'; ?>
				</div>
			<div class="form-group">
				<label>レコメンド(α):</label>
					<?php
					echo '<input type="radio" name="recommend" value="1" ';
					if (isset ( $_GET ["recommend"] ) && $_GET ["recommend"]) {
						echo 'checked';
					}
					echo '/>';
					echo 'ON';
					echo '<input type="radio" name="recommend" value="0" ';
					if (! isset ( $_GET ["recommend"] ) || ! $_GET ["recommend"]) {
						echo 'checked';
					}
					echo '/>';
					echo 'OFF';
					?>
				</div>
			<button type="submit" class="btn btn-default">Search</button>
		</form>
		<div class="page-header">
			<h1><?php
			if ($exist) {
				echo $user_name;
			} else {
			}
			?></h1>

			<p class="lead"></p>

		</div>
		<div class="row placeholders"
			<?php if (!$exist)echo 'style="visibility: hidden; height: 0;"';?>>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>AC問題数</h4>
				<h3><?php echo $acNum;?> 問</h3>
				<span class="text-muted"><?php echo "$acRank 位 / $memberNum 人中";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>ショートコード数</h4>
				<h3><?php echo $shortNum;?> 問</h3>
				<span class="text-muted"><?php echo "$shortRank 位 / $memberNum 人中";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>最速コード数</h4>
				<h3><?php echo $fastNum;?> 問</h3>
				<span class="text-muted"><?php echo "$fastRank 位 / $memberNum 人中";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>レベル</h4>
				<h3>Lv. <?php echo level($score);?></h3>
				<div class="text-muted">現在の経験値 <?php echo $score;?> pt.</div>
				<div class="text-muted">次のレベルまで、あと <?php echo (nextScore($score)-$score);?> pt.</div>
				<div class="text-muted">
					<a href="https://twitter.com/kenkoooo/status/622154927914115072"
						target='_blank'>スコアについて</a>
				</div>
			</div>
		</div>
	</div>
	<div class="container"
		<?php if (!$exist)echo 'style="visibility: hidden; height: 0;"';?>>
		<div class="page-header">
			<h1>AtCoder Beginner Contest</h1>
			<p class="lead"></p>

		</div>
		<div class="row placeholders">
		<?php
		
		for($i = 0; $i < 4; $i ++) {
			echo '<div class="col-xs-6 col-sm-3 placeholder">';
			echo '<h4>' . chr ( 65 + $i ) . '問題</h4>';
			echo "<div>
					<canvas id='abc$i' height='100%' width='100%'></canvas>
				</div>";
			$j = $abc [$i * 2];
			$k = $abc [$i * 2 + 1];
			$l = $k - $j;
			echo "<script>var doughnutData = [
　　{
　　　value: $j,
　　　color:'#32CD32'
　　},
   {
　　　value: $l,
　　　color: '#A8BECB'
　　}
];
 
var myDoughnut = new Chart(document.getElementById('abc$i').
getContext('2d')).Doughnut(doughnutData);
 
</script>";
			echo "
			<span class='text-muted'>$j 問 / $k 問</span>
		</div>";
		}
		
		?>
		
			

		
	</div>
	</div>
	<div class="container"
		<?php if (!$exist)echo 'style="visibility: hidden; height: 0;"';?>>
		<div class="page-header">
			<h1>AtCoder Regular Contest</h1>
			<p class="lead"></p>

		</div>
		<div class="row placeholders">
		<?php
		
		for($i = 0; $i < 4; $i ++) {
			echo '<div class="col-xs-6 col-sm-3 placeholder">';
			echo '<h4>' . chr ( 65 + $i ) . '問題 </h4>';
			echo "<div>
					<canvas id='arc$i' height='100%' width='100%'></canvas>
				</div>";
			$j = $arc [$i * 2];
			$k = $arc [$i * 2 + 1];
			$l = $k - $j;
			echo "<script>var doughnutData = [
　　{
　　　value: $j,
　　　color:'#32CD32'
　　},
   {
　　　value: $l,
　　　color: '#A8BECB'
　　}
];
 
var myDoughnut = new Chart(document.getElementById('arc$i').
getContext('2d')).Doughnut(doughnutData);
 
</script>";
			echo "
			<span class='text-muted'>$j 問 / $k 問</span>
		</div>";
		}
		
		?>
		
		</div>
	</div>

	<?php
	
	if ($exist && isset ( $_GET ["recommend"] ) && $_GET ["recommend"]) {
		// listRecommend ( $user_name );
	}
	?>

	<!-- div class="container" style="visibility: hidden; height: 0;"-->
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
	      $('#recommend').dataTable({
		        "bPaginate": false,
		        "bLengthChange": false,
		        "bFilter": true,
		        "bInfo": false,
		        "bAutoWidth": false,
				"aaSorting": [[ 3, "desc" ]]
		      });} );
	
	</script>
</body>
</html>
