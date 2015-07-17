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
				<span class="navbar-brand">AtCoder Problems</span>
			</div>
			<div id="navbar" class="navbar-collapse collapse">
				<ul class="nav navbar-nav">
					<li><a href="./">Home</a></li>
					<li><a href="./index.php?ranking=1">正解数ランキング</a></li>
					<li><a href="./index.php?ranking=2">ショートコーダー</a></li>
					<li><a href="./index.php?ranking=3">実行速度ランキング</a></li>
					<li><a href="http://atcoder.jp/">AtCoder (公式)</a></li>
					<li><a href="http://ichyo.jp/aoj-icpc/">AOJ-ICPC</a></li>
					<li><a href="http://twitter.com/kenkoooo">お問い合わせ</a></li>
				</ul>
			</div>
			<!--/.nav-collapse -->
		</div>
	</nav>
	<div class="container">
		<div class="page-header">
			<h1><?php
			if ($exist) {
				echo $user_name;
			} else {
				echo "ユーザーが存在しません";
			}
			?></h1>
			<p class="lead"></p>

		</div>
		<div class="row placeholders"
			<?php if (!$exist)echo 'style="visibility: hidden; height: 0;"';?>>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>AC問題数</h4>
				<h3><?php echo $acNum;?>問</h3>
				<span class="text-muted"><?php echo "$acRank 位 / $memberNum 人中";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>ショートコード数</h4>
				<h3><?php echo $shortNum;?>問</h3>
				<span class="text-muted"><?php echo "$shortRank 位 / $memberNum 人中";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>最速コード数</h4>
				<h3><?php echo $fastNum;?>問</h3>
				<span class="text-muted"><?php echo "$fastRank 位 / $memberNum 人中";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>Label</h4>
				<h3><?php echo $evaluate;?></h3>
				<span class="text-muted">Something else</span>
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
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>A問題</h4>
				<h3><?php echo round($abc[0]*100/$abc[1]);?> %</h3>
				<span class="text-muted"><?php echo "$abc[0] 問 / $abc[1] 問";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>B問題</h4>
				<h3><?php echo round($abc[2]*100/$abc[3]);?> %</h3>
				<span class="text-muted"><?php echo "$abc[2] 問 / $abc[3] 問";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>C問題</h4>
				<h3><?php echo round($abc[4]*100/$abc[5]);?> %</h3>
				<span class="text-muted"><?php echo "$abc[4] 問 / $abc[5] 問";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>D問題</h4>
				<h3><?php echo round($abc[6]*100/$abc[7]);?> %</h3>
				<span class="text-muted"><?php echo "$abc[6] 問 / $abc[7] 問";?></span>
			</div>
		</div>
	</div>
	<div class="container"
		<?php if (!$exist)echo 'style="visibility: hidden; height: 0;"';?>>
		<div class="page-header">
			<h1>AtCoder Regular Contest</h1>
			<p class="lead"></p>

		</div>
		<div class="row placeholders">
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>A問題</h4>
				<h3><?php echo round($arc[0]*100/$arc[1]);?> %</h3>
				<span class="text-muted"><?php echo "$arc[0] 問 / $arc[1] 問";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>B問題</h4>
				<h3><?php echo round($arc[2]*100/$arc[3]);?> %</h3>
				<span class="text-muted"><?php echo "$arc[2] 問 / $arc[3] 問";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>C問題</h4>
				<h3><?php echo round($arc[4]*100/$arc[5]);?> %</h3>
				<span class="text-muted"><?php echo "$arc[4] 問 / $arc[5] 問";?></span>
			</div>
			<div class="col-xs-6 col-sm-3 placeholder">
				<h4>D問題</h4>
				<h3><?php echo round($arc[6]*100/$arc[7]);?> %</h3>
				<span class="text-muted"><?php echo "$arc[6] 問 / $arc[7] 問";?></span>
			</div>
		</div>
	</div>

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

	$(document).ready(function() {} );
	
	</script>
</body>
</html>
