<script setup>
		  import { ref} from 'vue';
	      import { I18n } from 'aws-amplify/utils';
		  import '@aws-amplify/ui-vue/styles.css';
		  import Footer from './components/Footer.vue';
		  import { useI18n } from 'vue-i18n';
	         const { locale } = useI18n();
	     const showAuth = ref(true);
		 //const userLang = navigator.language.slice(0, 2);
	      //  const locale = userLang === 'ja' ? 'ja' : 'en';
	     //   switchLanguage(locale)
	     function switchLanguage(lang) {
		  locale.value = lang
	   	  I18n.setLanguage(lang); // 'ja' または 'en'
	  //localStorage.setItem('lang', lang); // 任意：次回アクセス時にも反映
	   showAuth.value = false;
	 setTimeout(() => {
	   showAuth.value = true;
	 }, 0);
	}
</script>

<template>
	<div id="app">
		<!-- <h3 style="margin-bottom:5px;">-->
		<div class="header">
			　　<img
				src="../src/assets/inkanCloud_Logo4E2.png"
				alt="ロゴ"
				style="
          max-width: 400px;
          height: 40px;
          vertical-align: middle;
          margin-left: -30px;
          margin-bottom: 20px;
        "
			/>
			<!--</h3>-->
		</div>
		<!--<button @click="switchLanguage('en')">English</button>
		<button @click="switchLanguage('ja')">日本語</button>-->
		<div auth v-if="showAuth">
			<router-view />
		</div>
		<Footer class="footer" />
	</div>
</template>
<style>
	#app {
	  font-size: 13px; /* アプリ全体のフォントサイズを規定 */
	  min-height: 100vh; /* 画面全体の高さを確保 */
	  /*display: flex;
	  flex-direction: column;*/
	}
	.header {
	  height: 40px;
	  width: 40%;
	  margin-top: 10px;
	  margin-bottom: 10px;
	  margin-left: 10px;
	}
	.footer {
	  position: fixed; /* 固定せず、通常フローで配置 */
	  bottom: 0px;
	  width: 100%;
	  text-align: center;
	}
</style>
