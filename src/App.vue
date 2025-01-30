<script setup>
  import { translations } from '@aws-amplify/ui-vue';
  import '@aws-amplify/ui-vue/styles.css';
  import Footer from './components/Footer.vue';

  import { I18n } from 'aws-amplify/utils';
  I18n.putVocabularies(translations);
  I18n.setLanguage('ja');
  I18n.putVocabularies({
    ja: {
      'Enter your Username': 'メールアドレスを入力 ',
      Username: 'メールアドレス ',
      Password: 'パスワード（8文字以上　大小英文字、数字、記号) ',
      'Attributes did not conform to the schema: email: The attribute is required':
        'メールアドレスがすでに登録されています',
      'Password must have at least 8 characters': 'パスワードは少なくとも8文字以上必要です',
      'Your passwords must match': '同じパスワードになっていません',
      'Incorrect username or password.': 'メールアドレスかパスワードが正しくありません',
    },
  });
</script>

<template>
  <div id="app">
    <!-- <h3 style="margin-bottom:5px;">-->
    <div class="header">
      　　<img
        src="../src/assets/inkanCloud_Logo4.png"
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
    <router-view />
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
