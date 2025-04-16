<script setup></script>

<template>
	<footer id="footer">
		<div class="container">
			<div class="footerCompany">
				<div class="footerLogo"></div>
				<span
					class="logoText"
					>{{$t('マーケットインターフェース株式会社')}}</span
				>
			</div>
			<ul class="footElemnt">
				<li>
					<a
						href="/guide/oin-cloudDoc.html"
						target="_blank"
						rel="noopener"
						>{{$t('押印クラウドとは')}}</a
					>
				</li>
				<li>
					<a
						href="https://mail.google.com/mail/?view=cm&to=oin_cloud@market-interface.co.jp&su=押印クラウドに関するお問合せ&body=お名前・連絡先・お問合せ内容でご入力ください"
						target="_blank"
						rel="noopener"
						>{{$t('お問合せ')}}</a
					>
				</li>
			</ul>
		</div>
	</footer>
</template>

<style scoped>
	.container {
	  background-color: #93c4f5;
	  text-align: center;
	  height: 50px;
	  display: flex;
	  border-top: solid 2px #0682fd;
	}
	.footElemnt {
	  display: flex; /* フレックスボックスを使用 */
	  justify-content: center; /* 中央揃え */
	  align-items: center;
	  list-style: none; /* リストのデフォルトマークを削除 */
	  padding: 0; /* パディングをリセット */
	  margin-left: 10%;
	}
	.footElemnt li {
	  margin: 0 40px; /* 要素間にスペースを追加 */
	  font-size: 14px; /* フォントサイズを調整 */
	}
	.footerLogo {
	  background-image: url(../assets/logo_4c-03-crop.png);
	  background-repeat: no-repeat;
	  background-size: contain;
	  background-position: center;
	  width: 40px;
	  height: 40px;
	  margin-right: 5px;
	  text-align: center;
	}
	.logoText {
	  font-size: 14px; /* テキストのサイズ */
	  color: #333; /* テキストの色 */
	  align-self: center;
	}
	.footerCompany {
	  display: flex;
	  margin-top: 5px;
	}
</style>
