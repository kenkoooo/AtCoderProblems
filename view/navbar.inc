<div id="navbar" class="navbar-collapse collapse">
	<ul class="nav navbar-nav">
		<li
			<?php if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"]==1) echo ' class="active"';?>><a
			href="./index.php?ranking=1">AC数</a></li>
		<li
			<?php if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"]==2) echo ' class="active"';?>><a
			href="./index.php?ranking=2">ショートコード</a></li>
		<li
			<?php if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"]==3) echo ' class="active"';?>><a
			href="./index.php?ranking=3">実行速度</a></li>
		<li
			<?php if (isset ( $_GET ["ranking"] ) && $_GET ["ranking"]==4) echo ' class="active"';?>><a
			href="./index.php?ranking=4">最速提出</a></li>
		<li <?php if ($exist) echo ' class="active"';?>><a
			href="./user.php?name=<?php echo $user_name;?>">ユーザーページ</a></li>
		<li><a href="http://atcoder.jp/" target='_blank'>AtCoder (公式)</a></li>
		<li><a href="http://ichyo.jp/aoj-icpc/" target='_blank'>AOJ-ICPC</a></li>
		<li><a href="http://twitter.com/kenkoooo" target='_blank'>お問い合わせ</a></li>
	</ul>
</div>