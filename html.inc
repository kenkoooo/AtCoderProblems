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
				<span class="navbar-brand">AtCoder 非公式まとめサイト</span>
			</div>
			<div id="navbar" class="navbar-collapse collapse">
				<ul class="nav navbar-nav">
					<li class="active"><a href="./">Home</a></li>
					<li><a href="http://atcoder.jp/">AtCoder</a></li>
					<li><a href="http://ichyo.jp/aoj-icpc/">AOJ-ICPC</a></li>
					<li><a href="http://twitter.com/kenkoooo">お問い合わせ</a></li>
				</ul>
			</div>
			<!--/.nav-collapse -->
		</div>
	</nav>

	<div class="container">
		<form action="index.php" method="get" class="form-inline">
			<div class="form-group"><?php
			echo '<input type="text" class="form-control" id="exampleInputEmail1" placeholder="User ID" name="name" value="' . $user_name . '">';
			?>

						</div>
			<button type="submit" class="btn btn-default">Search</button>
		</form>
	</div>

	<div class="container">
		<div class="page-header">
			<h1>AtCoder Beginner Contest</h1>
		</div>
		<table
			class="table table-hover table-striped table-bordered table-condensed">
			<thead>
				<tr>
					<th>コンテスト</th>
					<th>A問題</th>
					<th>B問題</th>
					<th>C問題</th>
					<th>D問題</th>
				</tr>
			</thead>
			<tbody>
				<?php listupARC($abcArray);?>
			</tbody>
		</table>
	</div>

	<div class="container">
		<div class="page-header">
			<h1>AtCoder Regular Contest</h1>
		</div>
		<table
			class="table  table-hover table-striped table-bordered  table-condensed">
			<thead>
				<tr>
					<th>コンテスト</th>
					<th>A問題</th>
					<th>B問題</th>
					<th>C問題</th>
					<th>D問題</th>
				</tr>
			</thead>
			<tbody>
				<?php listupARC($arcArray);?>
			</tbody>
		</table>
	</div>

	<div class="container">
		<div class="page-header">
			<h1>その他のコンテスト（作りかけ）</h1>
		</div>
		<table
			class="table table-hover table-striped table-bordered table-condensed">
			<thead>
				<tr>
					<th>コンテスト</th>
				</tr>
			</thead>
			<tbody>
				<?php listupARC($allArray);?>
			</tbody>
		</table>
	</div>

	<!-- /container -->


	<!-- Bootstrap core JavaScript
    ================================================== -->
	<!-- Placed at the end of the document so the pages load faster -->
	<script
		src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
	<script src="js/bootstrap.min.js"></script>
</body>
</html>
