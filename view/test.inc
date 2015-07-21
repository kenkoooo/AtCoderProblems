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
<link rel="stylesheet"
	href="//cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.8.1/bootstrap-table.min.css">

<!-- Custom styles for this template -->
<link href="theme.css" rel="stylesheet">


<!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
<!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
<script
	src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script
	src="//cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.8.1/bootstrap-table.min.js"></script>
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
			<?php include 'view/navbar.inc';?>
			<!--/.nav-collapse -->
		</div>
	</nav>
	<div class="container">

		<div class="page-header">
			<h1>AtCoder Problems</h1>
			<p class="lead">
				<a href="http://atcoder.jp/">AtCoder</a>の非公式過去問集です。User
				IDからACした問題を検索できます。(更新処理は5分ごと)
			</p>
			<form action="index.php" method="get" class="form-inline">
				<div class="form-group">
					<label>User ID:</label>
					<?php echo '<input type="text" class="form-control" id="exampleInputEmail1" placeholder="User ID" name="name" value="' . $user_name . '">'; ?>
				</div>
				<div class="form-group">
					<label>ライバル:</label><input type="text" class="form-control"
						id="exampleInputEmail1" placeholder="User ID" name="rivals">
				</div>
				<div class="form-group">
					<input type="radio" name="category" value="1" />カテゴリ<input
						type="radio" name="category" value="0" />リスト
				</div>
				<button type="submit" class="btn btn-default">Search</button>
			</form>
		</div>
	</div>

	<div class="container">
		<table id="table" data-toggle="table" data-url="data1.json"
			data-sort-name="price" data-sort-order="desc">
			<thead>
				<tr>
					<th data-field="id" data-sortable="true">Item ID</th>
					<th data-field="name" data-sortable="true">Item Name</th>
					<th data-field="price" data-sortable="true"
						data-sorter="priceSorter">Item Price</th>
				</tr>
			</thead>
		</table>
	</div>

	<!-- /container -->



</body>
</html>
