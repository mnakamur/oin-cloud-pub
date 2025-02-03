<script setup>
  import { reactive, ref, onMounted } from 'vue';

  import { bunsyoByCreateUser } from '../graphql/queries';
  import { generateClient } from 'aws-amplify/api';
  import { fetchUserAttributes } from 'aws-amplify/auth';
  import { convertForDisplay, formatToJST, useMsgHandler } from './utils/helper';
  import router from '../router';
  import Signstatus from './SignStatus.vue';
  import Pdfmanage from './PdfManage.vue';
  const client = generateClient();
  const createUser = ref();
  const userId = ref();
  const { errorVisible, infoVisible, infoMessage } = useMsgHandler();
  const items = reactive([]);
  const rootdocId = ref();
  const rootShowStatus = ref(false);
  const pdfmanageShow = ref(false);
  const pdfMData = reactive({
    docName: '',
    docId: '',
    createUserId: '',
  });

  onMounted(async () => {
    await fetchCreateUserAttributes();

    fetchBunsyoList();
  });
  async function fetchCreateUserAttributes() {
    const result = await fetchUserAttributes();
    userId.value = result.sub;
    createUser.value = result.name;
  }
  async function fetchBunsyoList() {
    const bunsyo = await client.graphql({
      query: bunsyoByCreateUser,
      variables: { createUser: userId.value, sortDirection: 'DESC', limit: 200 },
    });
    bunsyo.data.bunsyoByCreateUser.items.map((item) => {
      items.push({
        docName: item.docName,
        docId: item.pdfId,
        createDate: formatToJST(item.createdAt),
        route: item.shomeiLength + '人',
        status: convertForDisplay(item.bunStatus),
        time: formatToJST(item.updatedAt),
      });
    });
  }
  function profile() {
    router.push({ name: 'userprofile' });
  }
  function rootshow(docId) {
    rootShowStatus.value = true;
    rootdocId.value = docId;
  }
  function pdfmshow(docId, docName) {
    pdfmanageShow.value = true;
    pdfMData.docId = docId;
    pdfMData.docName = docName;
    pdfMData.createUserId = userId.value;
  }
  function closeSignstatus() {
    rootShowStatus.value = false;
  }
  function closepdfmanage() {
    pdfmanageShow.value = false;
  }
</script>
<template>
  <div>
    <h4>
      作成者：{{ createUser }} <button class="profile" @click="profile">プロフィール編集</button>
    </h4>
    <router-link to="/" tag="button" class="button-class">作成画面に戻る</router-link>
  </div>

  <div>
    <h4>文書一覧</h4>
    <signstatus
      v-if="rootShowStatus"
      :pdfId="rootdocId"
      :origin="'manage'"
      @close="closeSignstatus"
      style="margin-top: -5%"
    />

    <pdfmanage v-if="pdfmanageShow" :data="pdfMData" @close="closepdfmanage" />
    <table class="table">
      <thead>
        <tr>
          <th scope="col" />
          <th scope="col">文書名</th>
          <th scope="col">作成日</th>
          <th scope="col">ルート数</th>
          <th scope="col">状態</th>
          <th scope="col">最終更新時間</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td scope="row">{{ index + 1 }}</td>
          <td>
            <a href="#" @click.prevent="pdfmshow(item.docId, item.docName)"> {{ item.docName }}</a>
          </td>

          <td>{{ item.createDate }}</td>
          <td>
            <a href="#" @click.prevent="rootshow(item.docId)">{{ item.route }}</a>
          </td>
          <td>{{ item.status }}</td>
          <td>{{ item.time }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="infoVisible" :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }">
      {{ infoMessage }}
    </div>
  </div>
</template>

<style scoped>
  .profile {
    position: relative;
    margin-left: 10px;
  }
  h4 {
    margin-top: 5px;
    margin-bottom: 10px;
  }
  p {
    margin-top: 2px;
    margin-bottom: 2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  .opearea {
    margin-top: 10px;
    float: left;
  }
  .docarea {
    overflow-y: scroll;
    max-width: 95%;
    margin-top: 50px;
    float: right;
    left: auto;
    position: absolute;
  }
  .selected-pdf {
    box-shadow: 0 0 0 1px rgba(52, 117, 224, 0.5);
  }
  .selected-page {
    width: 100%;
    overflow: hidden;
  }
  .each-page {
    position: relative;
    box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);
    margin-bottom: 1px;
  }
  .object {
    position: absolute;
    top: 10px;
    left: 10px;
    transform-origin: top left;
  }
  .button {
    margin-right: 10px;
  }
  .buttonD {
    margin-left: 30px;
  }
  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  .form-row {
    margin-bottom: 10px;
  }
  .error {
    color: red;
  }
  .error-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ffcccc;
    padding: 10px;
    border: 1px solid #ff0000;
  }
  .info-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #cce5ff;
    padding: 10px;
    border: 1px solid #ff0000;
  }
  .button-class {
    display: inline-flex;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    color: white;
    background-color: #007bff;
    border: none;
    border-radius: 4px;
    transition: background-color 0.3s ease;
    float: right;
  }
  .button-class:hover {
    background-color: #0056b3;
  }
</style>
