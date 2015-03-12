<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="">
<meta name="author" content="">
<link rel="icon" href="../../favicon.ico">

<title>Theme Template for Bootstrap</title>

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
				<a class="navbar-brand" href="#">AtCoder まとめサイト</a>
			</div>
			<div id="navbar" class="navbar-collapse collapse">
				<ul class="nav navbar-nav">
					<li class="active"><a href="./">Home</a></li>
				</ul>
			</div>
			<!--/.nav-collapse -->
		</div>
	</nav>

	<div class="container">
		<div class="page-header">
			<h1>AtCoder Beginner Contest</h1>
		</div>
		<table class="table  table-hover table-striped table-bordered">
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
		<table class="table  table-hover table-striped table-bordered">
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

	<!--  
	<div class="container">
		<div class="page-header">
			<h1>全部</h1>
		</div>
		<table class="table">
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
	-->

	<!-- /container -->


	<!-- Bootstrap core JavaScript
    ================================================== -->
	<!-- Placed at the end of the document so the pages load faster -->
	<script
		src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
	<script src="js/bootstrap.min.js"></script>
</body>
</html>
