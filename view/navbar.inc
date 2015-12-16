<div class="navbar-header">
	<button type="button" class="navbar-toggle collapsed"
		data-toggle="collapse" data-target="#navbar" aria-expanded="false"
		aria-controls="navbar">
		<span class="sr-only">Toggle navigation</span> <span class="icon-bar"></span>
		<span class="icon-bar"></span> <span class="icon-bar"></span>
	</button>
	<a class="navbar-brand"
		href="./index.php?name=<?php echo $user_name;?>">AtCoder Problems</a>
</div>
<div id="navbar" class="navbar-collapse collapse">
	<ul class="nav navbar-nav">
		<li class="dropdown"><a aria-expanded="false" aria-haspopup="true"
			role="button" data-toggle="dropdown" class="dropdown-toggle" href="#">ランキング
				<span class="caret"></span>
		</a>
			<ul class="dropdown-menu">
				<li
					<?php
					
					if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"] == 1) {
						echo ' class="active"';
					}
					?>><a href="./index.php?ranking=1">AC数</a></li>
				<li
					<?php
					
					if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"] == 2) {
						echo ' class="active"';
					}
					?>><a href="./index.php?ranking=2">ショートコード数</a></li>
				<li
					<?php
					
					if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"] == 3) {
						echo ' class="active"';
					}
					?>><a href="./index.php?ranking=3">最速実行コード数</a></li>
				<li
					<?php
					
					if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"] == 4) {
						echo ' class="active"';
					}
					?>><a href="./index.php?ranking=4">最速提出数</a></li>
			</ul></li>

		<li <?php if ($exist) {echo ' class="active"';} ?>><a
			href="./user.php?name=<?php echo $user_name;?>">ユーザーページ</a></li>

		<li class="dropdown"><a aria-expanded="false" aria-haspopup="true"
			role="button" data-toggle="dropdown" class="dropdown-toggle" href="#">リンク
				<span class="caret"></span>
		</a>
			<ul class="dropdown-menu">
				<li><a href="http://atcoder.jp/" target='_blank'>AtCoder (公式)</a></li>
				<li><a href="http://ichyo.jp/aoj-icpc/" target='_blank'>AOJ-ICPC</a></li>
				<li><a href="http://twitter.com/kenkoooo" target='_blank'>お問い合わせ</a></li>
			</ul></li>
	</ul>
</div>