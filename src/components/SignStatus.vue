<script setup>
  import { reactive, ref, onMounted } from 'vue';
  import router from '../router';
  import { getBunsyo, shomeiByBunsyo } from '../graphql/queries';
  import { generateClient } from 'aws-amplify/api';
  import { convertForDisplay, formatToJST } from './utils/helper';

  const client = generateClient();

  const formItems = reactive([]);
  const query = ref({});
  const bunsyoName = ref();
  const fullShow = ref(false);
  const errorVisible = ref(false);
  const infoVisible = ref(false);
  const infoMessage = ref('');

  const props = defineProps({
    pdfId: { required: true, type: String },
    origin: { required: true, type: String },
    routeNo: { required: false, type: String },
  });
  const emit = defineEmits(['close']);
  onMounted(() => {
    query.value = props.pdfId ?? router.currentRoute.value.params.param;
    fullShow.value = props.origin == 'manage' ? true : false;
    fetchBunsyo();
    fetchShomei();
  });

  async function fetchBunsyo() {
    const bunsyo = await client.graphql({
      query: getBunsyo,
      variables: { id: query.value },
    });

    bunsyoName.value = bunsyo.data.getBunsyo.docName;
  }
  async function fetchShomei() {
    const shomei = await client.graphql({
      query: shomeiByBunsyo,
      variables: { bunsyoShomeiId: query.value, sortDirection: 'ASC' },
    });

    addFormItem(shomei);
  }

  function addFormItem(shomei) {
    shomei.data.shomeiByBunsyo.items.forEach((item, index) => {
      const shomeiItem = {
        seq: item.seq,
        name: item.name,
        email: item.mail,
        attribute: convertForDisplay(item.shomeiNaiyo),
        status: convertForDisplay(item.shomeiStatus),
        time: formatToJST(item.updatedAt),
        message: item.commentToAuthor,
      };
      if (props.origin == 'signdo' && shomeiItem.status === '作成済') {
        shomeiItem.status = '';
        shomeiItem.time = '';
      }
      formItems.push(shomeiItem);
    });
  }

  function goEditor() {
    router.push({ name: 'signin' });
  }

  function closeStatus() {
    emit('close');
  }
</script>
<template>
  <div class="rootshow">
    <div style="margin-left: 5px">
      <h4 style="margin-bottom: 3px">署名ステータス参照</h4>
      <h5 v-if="fullShow" style="margin: 1px">
        文書のステータスを確認します。
        却下されている場合は理由を確認して、再度文書登録から実施してください。
      </h5>

      <h4 style="margin: 1px">文書名：{{ bunsyoName }}</h4>
    </div>

    <table>
      <thead>
        <tr>
          <th rowspan="2">順序</th>
          <th>名前</th>
          <th v-if="fullShow">e-mailアドレス</th>
          <th v-if="fullShow">署名条件</th>
          <th>ステータス</th>
          <th v-if="fullShow">処理時刻</th>
        </tr>
        <tr>
          <th v-if="fullShow" colspan="5">メッセージ</th>
        </tr>
      </thead>
      <tbody v-for="(item, index) in formItems" :key="index">
        <tr :style="{ backgroundColor: parseInt(props.routeNo) === index ? '#cce7ff' : '' }">
          <td rowspan="2">
            {{ index + 1 }}
          </td>
          <td>{{ item.name }}<span style="float: right">様</span></td>
          <td v-if="fullShow">
            {{ item.email }}
          </td>
          <td v-if="fullShow">
            {{ item.attribute }}
          </td>
          <td>
            {{ item.status }}
          </td>
          <td v-if="fullShow">
            {{ item.time }}
          </td>
        </tr>
        <tr v-if="(item.message && fullShow) || item.status == '却下済'">
          <td colspan="5">
            {{ item.message }}
          </td>
        </tr>
      </tbody>
    </table>
    <button v-if="fullShow" @click="goEditor">作成画面に戻る</button>
    <button v-if="origin == 'manage'" @click="closeStatus">管理画面に戻る</button>
    <button v-else-if="origin == 'signdo'" @click="closeStatus">署名画面に戻る</button>
    <button v-else @click="goEditor">作成画面で詳細を確認する</button>

    <div v-if="infoVisible" :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }">
      {{ infoMessage }}
    </div>
  </div>
</template>

<style scoped>
  .rootshow {
    position: fixed;
    background-color: white;
    z-index: 4;
    width: 80%;
    height: 70%;
    border: solid 2px #0000ff;
    margin-left: 10%;
    overflow: scroll;
  }
  table {
    width: 98%;
    border-collapse: collapse;
    margin-bottom: 10px;
    margin-left: 5px;
  }

  th,
  td {
    border: 1px solid black;
    padding: 2px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
  tr {
    border: 1px dotted black;
  }
  .pm-button {
    width: 15px;
    height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #6fa1ff;
    color: #fff;
    text-align: center;
    font-size: 13px;
    margin-right: 3px;
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
</style>
