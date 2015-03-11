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

	<div class="container theme-showcase" role="main">

		<div class="page-header">
			<h1>Tables</h1>
		</div>
		<div class="row">
			<div class="col-md-6">
				<table class="table">
					<thead>
						<tr>
							<th>#</th>
							<th>First Name</th>
							<th>Last Name</th>
							<th>Username</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>1</td>
							<td>Mark</td>
							<td>Otto</td>
							<td>@mdo</td>
						</tr>
						<tr>
							<td>2</td>
							<td>Jacob</td>
							<td>Thornton</td>
							<td>@fat</td>
						</tr>
						<tr>
							<td>3</td>
							<td>Larry</td>
							<td>the Bird</td>
							<td>@twitter</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="col-md-6">
				<table class="table table-striped">
					<thead>
						<tr>
							<th>#</th>
							<th>First Name</th>
							<th>Last Name</th>
							<th>Username</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>1</td>
							<td>Mark</td>
							<td>Otto</td>
							<td>@mdo</td>
						</tr>
						<tr>
							<td>2</td>
							<td>Jacob</td>
							<td>Thornton</td>
							<td>@fat</td>
						</tr>
						<tr>
							<td>3</td>
							<td>Larry</td>
							<td>the Bird</td>
							<td>@twitter</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div class="row">
			<div class="col-md-6">
				<table class="table table-bordered">
					<thead>
						<tr>
							<th>#</th>
							<th>First Name</th>
							<th>Last Name</th>
							<th>Username</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td rowspan="2">1</td>
							<td>Mark</td>
							<td>Otto</td>
							<td>@mdo</td>
						</tr>
						<tr>
							<td>Mark</td>
							<td>Otto</td>
							<td>@TwBootstrap</td>
						</tr>
						<tr>
							<td>2</td>
							<td>Jacob</td>
							<td>Thornton</td>
							<td>@fat</td>
						</tr>
						<tr>
							<td>3</td>
							<td colspan="2">Larry the Bird</td>
							<td>@twitter</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="col-md-6">
				<table class="table table-condensed">
					<thead>
						<tr>
							<th>#</th>
							<th>First Name</th>
							<th>Last Name</th>
							<th>Username</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>1</td>
							<td>Mark</td>
							<td>Otto</td>
							<td>@mdo</td>
						</tr>
						<tr>
							<td>2</td>
							<td>Jacob</td>
							<td>Thornton</td>
							<td>@fat</td>
						</tr>
						<tr>
							<td>3</td>
							<td colspan="2">Larry the Bird</td>
							<td>@twitter</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>



		<div class="page-header">
			<h1>Labels</h1>
		</div>
		<h1>
			<span class="label label-default">Default</span> <span
				class="label label-primary">Primary</span> <span
				class="label label-success">Success</span> <span
				class="label label-info">Info</span> <span
				class="label label-warning">Warning</span> <span
				class="label label-danger">Danger</span>
		</h1>
		<h2>
			<span class="label label-default">Default</span> <span
				class="label label-primary">Primary</span> <span
				class="label label-success">Success</span> <span
				class="label label-info">Info</span> <span
				class="label label-warning">Warning</span> <span
				class="label label-danger">Danger</span>
		</h2>
		<h3>
			<span class="label label-default">Default</span> <span
				class="label label-primary">Primary</span> <span
				class="label label-success">Success</span> <span
				class="label label-info">Info</span> <span
				class="label label-warning">Warning</span> <span
				class="label label-danger">Danger</span>
		</h3>
		<h4>
			<span class="label label-default">Default</span> <span
				class="label label-primary">Primary</span> <span
				class="label label-success">Success</span> <span
				class="label label-info">Info</span> <span
				class="label label-warning">Warning</span> <span
				class="label label-danger">Danger</span>
		</h4>
		<h5>
			<span class="label label-default">Default</span> <span
				class="label label-primary">Primary</span> <span
				class="label label-success">Success</span> <span
				class="label label-info">Info</span> <span
				class="label label-warning">Warning</span> <span
				class="label label-danger">Danger</span>
		</h5>
		<h6>
			<span class="label label-default">Default</span> <span
				class="label label-primary">Primary</span> <span
				class="label label-success">Success</span> <span
				class="label label-info">Info</span> <span
				class="label label-warning">Warning</span> <span
				class="label label-danger">Danger</span>
		</h6>
		<p>
			<span class="label label-default">Default</span> <span
				class="label label-primary">Primary</span> <span
				class="label label-success">Success</span> <span
				class="label label-info">Info</span> <span
				class="label label-warning">Warning</span> <span
				class="label label-danger">Danger</span>
		</p>





	</div>

	<div class="container">
		<table class="table">
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
				<tr>
					<td>1</td>
					<td>Mark</td>
					<td>Otto</td>
					<td>@mdo</td>
					<td>@mdo</td>
				</tr>
				<tr>
					<td>2</td>
					<td>Jacob</td>
					<td>Thornton</td>
					<td>@fat</td>
				</tr>
				<tr>
					<td>3</td>
					<td>Larry</td>
					<td>the Bird</td>
					<td>@twitter</td>
				</tr>
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
