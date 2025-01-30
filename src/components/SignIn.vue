<script setup>
  import PdfEditor from './PdfEditor.vue';
  import { Authenticator } from '@aws-amplify/ui-vue';
  import '@aws-amplify/ui-vue/styles.css';
  import router from '../router';

  function manage() {
    router.push({ name: 'signmanage' });
  }
</script>

<template>
  <authenticator :login-mechanisms="['email']">
    <template v-slot="{ user, signOut }">
      <h4 style="margin-top: 5px">こんにちは{{ user.username }} さん</h4>
      <div class="signin">
        <PdfEditor pdf="./src/assets/sample.pdf" />
        <button class="manageb" @click="manage">管理画面・プロフィール編集</button>
        <button class="managec" @click="signOut">Sign Out</button>
      </div>
    </template>
  </authenticator>
</template>
<style scoped>
  .signin {
    display: grid;
  }
  .manageb {
    float: left;
    margin-bottom: 10px;
    max-width: 200px;
  }
  .managec {
    float: left;
    margin-bottom: 50px;
    max-width: 200px;
  }
</style>
