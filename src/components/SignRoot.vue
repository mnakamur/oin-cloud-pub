<script setup>
  import { reactive, ref, onMounted } from 'vue';
  import router from '../router';
  import { createShomei, updateBunsyo } from '../graphql/mutations';
  import { getBunsyo } from '../graphql/queries';
  import { generateClient } from 'aws-amplify/api';
  import { errorToLambda, invokeLambda } from './utils/lambdahelper';
  import { useMsgHandler } from './utils/helper';
  const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();

  import Signdesi from './SignDesi.vue';
  const client = generateClient();

  const rootItems = reactive([{ name: '', email: '', attribute: 'signonly', status: 'false' }]);
  const rootIForm = reactive({});
  const query = ref({});
  const errors = ref([]);

  const signInputFlg = ref(false);
  const signdesi = reactive({
    isShow: false,
    rootSave: false,
    shomeiGo: false,
    shomeiSend: false,
    isFormDisabled: false,
  });
  const desiData = reactive({
    docName: '',
    docId: '',
    rootIndex: '',
    shomeiName: '',
    userName: '',
    userEmail: '',
    createUserId: '',
    s3folder: '',
  });
  const processStep = ref(1);
  let isReloading = false;

  onMounted(() => {
    query.value = router.currentRoute.value.query;
    desiData.docId = router.currentRoute.value.query.pdfId;

    fetchBunsyo();

    window.addEventListener('beforeunload', function (event) {
      event.preventDefault();
    });
  });

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  const validateName = (name) => {
    const forbiddenPatterns = [
      /select/i, // SELECT文
      /insert/i, // INSERT文
      /update/i, // UPDATE文
      /delete/i, // DELETE文
      /drop/i, // DROP文
      /;/, // セミコロン
      /--/, // コメント記号
    ];
    return !forbiddenPatterns.some((pattern) => pattern.test(name));
  };

  const validateForm = () => {
    errors.value = [];

    rootItems.forEach((item, index) => {
      const itemErrors = {};

      if (!item.name.trim()) {
        itemErrors.name = '名前は必須です';
      } else if (!validateName(item.name)) {
        itemErrors.name = '名前に不正な文字が含まれています。修正してください';
      }
      if (!item.email.trim()) {
        itemErrors.email = 'Eメールは必須です';
      } else if (!validateEmail(item.email)) {
        itemErrors.email = '有効なEメールアドレスを入力してください';
      }
      errors.value[index] = itemErrors;
      if (item.attribute == 'signinput') {
        signInputFlg.value = true;
      }
    });

    return errors.value.every((item) => Object.keys(item).length === 0);
  };

  async function fetchBunsyo() {
    const bunsyo = await client.graphql({
      query: getBunsyo,
      variables: { id: query.value.pdfId },
    });

    desiData.docName = bunsyo.data.getBunsyo.docName;
    desiData.userName = bunsyo.data.getBunsyo.userName;
    desiData.userEmail = bunsyo.data.getBunsyo.userEmail;
    desiData.createUserId = bunsyo.data.getBunsyo.createUser;
    desiData.s3folder = bunsyo.data.getBunsyo.identityId;
    const initItem = {
      name: desiData.userName,
      email: desiData.userEmail,
      attribute: 'signonly',
      status: 'false',
    };
    rootItems[0] = initItem;
  }

  function addFormItem() {
    const defaultItem = {
      name: '',
      email: '',
      attribute: 'signonly',
      status: 'false',
    };
    rootItems.push(defaultItem);
    rootIForm[rootItems.length - 1] = { ...defaultItem };
  }
  function deleteFormItem(index) {
    rootItems.splice(index, 1);
  }

  async function saveRootItem() {
    for (const [index, item] of rootIForm.value.entries()) {
      try {
        const result = await client.graphql({
          query: createShomei,
          variables: {
            input: {
              id: query.value.pdfId + index,
              seq: index,
              name: item.name,
              mail: item.email,
              shomeiStatus: 'save',
              shomeiNaiyo: item.attribute,
              bunsyoShomeiId: query.value.pdfId,
            },
          },
        });
        signdesi.rootSave = true;
      } catch (error) {
        errorToLambda(desiData.createUserId, query.value.pdfId, 'SignRoot', 'saveRootItem', error);
        signdesi.rootSave = false;
      }
    }
    if (signdesi.rootSave) {
      showMessage('ルート保存できましたので、入力設定もしくは文書回送に進んでください。', 'info');
    } else {
      showMessage('ルートが保存できませんでした。');
    }
  }

  function handleInput(index, key, value) {
    rootItems[index][key] = value;
  }

  function submitRootSave() {
    if (validateForm()) {
      if (saveRootConfirm() == false) return;
      rootIForm.value = [...rootItems];
      saveRootItem();
      rootItemsCheck();
      processStep.value += 1;
      signdesi.isFormDisabled = true;
    } else {
      showMessage('ルート設定に誤りがあります。');
    }
  }
  function openSigndesiDialog(index) {
    if (signdesi.rootSave) {
      signdesi.isShow = true;
      desiData.rootIndex = index;
      desiData.shomeiName = rootItems[index]['name'];
    } else {
      showMessage('ルート保存後入力設定をしてください。');
    }
  }
  function closeSigndesi() {
    signdesi.isShow = false;
  }
  function signdesiFinished(index) {
    rootItems[index]['status'] = 'true';
    rootItemsCheck();
  }
  function rootItemsCheck() {
    const result = rootItems.filter(
      (item) => item.attribute == 'signinput' && item.status == 'false'
    );
    if (result.length == 0) {
      signdesi.shomeiGo = true;
    }
  }

  async function shomeiGo() {
    if (signdesi.shomeiSend == true) {
      return;
    }
    signdesi.shomeiSend = true;
    await call_shomeiFlow();
    if (signdesi.shomeiSend) {
      await Updatebunsyo();
    }
  }
  async function call_shomeiFlow() {
    //const lambdaRes = await invokeLambda('shomeiFlow', { pdfId: query.value.pdfId, routeNo: 0 });
    const lambdaRes = await invokeLambda('shomeiPdfSign', {
      pdfId: query.value.pdfId,
      routeNo: 0,
      createUserId: desiData.createUserId,
      s3folder: desiData.s3folder,
    });
    if (lambdaRes.statusCode && lambdaRes.statusCode < 400) {
      showMessage('文書をルートに回送しました。', 'info');
      desiData.docName += ':回送済み';
    } else {
      signdesi.shomeiSend = false;
      showMessage('文書送付に失敗しました。');
    }
  }

  async function Updatebunsyo() {
    const updateBstatus = {
      id: query.value.pdfId,
      shomeiLength: rootIForm.value.length,
      bunStatus: 'send',
    };
    try {
      const result_Bstatus = await client.graphql({
        query: updateBunsyo,
        variables: {
          input: updateBstatus,
        },
      });
      signdesi.shomeiGo = false;
    } catch (error) {
      signdesi.rootSave = false;
      showMessage('文書更新に失敗しました。再度実施してください');
      errorToLambda(
        desiData.createUserId,
        query.value.pdfId,
        'SignRoot',
        'call_shomeiGo',
        infoMessage.value
      );
    }
  }
  function closeWindow() {
    const userConfirmed = window.confirm('画面を終了して初期画面に戻ります');
    if (userConfirmed) {
      router.replace({ name: 'signin' });
    }
  }
  function saveRootConfirm() {
    const userConfirmed = window.confirm(
      '回送ルートを保存します。\nルートやメールアドレスを確認してください\n署名属性を確認してください\n正しければOKを押して次に進んでください'
    );
    if (userConfirmed) {
      return true;
    } else {
      return false;
    }
  }
</script>
<template>
  　　
  <div style="margin-top: -40px">
    <h3 style="margin-bottom: 5px">署名ルート作成</h3>
    <div v-if="processStep == 1" style="margin-bottom: 5px">
      <h4>
        文書を回送するルートを作成します。<br />
        ルートを追加し、メールアドレスを入力します。<br />
        各署名者の属性を選択します。署名時に入力（押印、日付等の入力）がある場合は、署名入力ありを選択してください。
      </h4>
    </div>
    <h4 v-if="processStep > 1 && signInputFlg == true" style="margin-bottom: 5px">
      入力設定ボタンを押して入力設定を行ってください。設定完了後、文書を回送してください
    </h4>
    <h4 v-if="processStep > 1 && signInputFlg == false" style="margin-bottom: 5px">
      文書を回送します
    </h4>
    <h4 :style="signdesi.shomeiSend ? { color: 'blue', fontSize: '20px' } : {}">
      文書名：{{ desiData.docName }}
    </h4>
  </div>
  <Suspense>
    <div id="app">
      <Signdesi
        v-if="signdesi.isShow"
        :data="desiData"
        @close="closeSigndesi"
        @finished="signdesiFinished"
      />
      <form @submit.prevent="submitRootSave">
        <table>
          <thead>
            <tr>
              <th>削除</th>
              <th>署名順番</th>
              <th>名前</th>
              <th>e-mailアドレス</th>
              <th>属性</th>
              <th>入力設定</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in rootItems" :key="index">
              <td>
                <button
                  v-if="index > 0 && processStep == 1"
                  class="pm-button"
                  @click="deleteFormItem(index)"
                  :disabled="signdesi.isFormDisabled"
                >
                  ×
                </button>
              </td>
              <td>
                {{ index + 1 }}
              </td>
              <td>
                <input
                  :value="item.name"
                  @input="handleInput(index, 'name', $event.target.value)"
                  type="text"
                  class="c95p"
                  placeholder="Enter name"
                  :disabled="index === 0 || signdesi.isFormDisabled"
                />
                <div class="error" v-if="errors[index]?.name">
                  {{ errors[index]?.name }}
                </div>
              </td>
              <td>
                <input
                  :value="item.email"
                  @input="handleInput(index, 'email', $event.target.value)"
                  type="email"
                  class="c95p"
                  placeholder="Enter email"
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  title="メールアドレス形式で入力してください"
                  :disabled="index === 0 || signdesi.isFormDisabled"
                />
                <div class="error" v-if="errors[index]?.email">
                  {{ errors[index]?.email }}
                </div>
              </td>
              <td>
                　　<select
                  :value="item.attribute"
                  :disabled="index === 0 || signdesi.isFormDisabled"
                  @input="handleInput(index, 'attribute', $event.target.value)"
                >
                  <option value="signonly">署名のみ（入力なし）</option>
                  <option value="signinput">署名入力あり</option>
                </select>
              </td>
              <td>
                <button
                  type="button"
                  v-if="processStep > 1 && item.attribute === 'signinput'"
                  @click="openSigndesiDialog(index)"
                  :style="{ backgroundColor: item.status !== 'true' ? 'turquoise' : '#ddd' }"
                >
                  入力設定
                </button>
                <div v-if="item.status === 'true'">設定完了</div>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
      <button class="buttonB" v-if="processStep == 1" @click="addFormItem">
        ルートを追加します
      </button>
      <button
        class="buttonR"
        v-if="rootItems.length > 1 && processStep == 1"
        @click="submitRootSave"
        type="submit"
      >
        ルートを保存し入力設定・回送を行う
      </button>
      <button
        type="button"
        class="buttonB"
        v-if="
          (signdesi.shomeiGo && processStep > 1) ||
          (processStep > 1 && signInputFlg == false && signdesi.shomeiSend == false)
        "
        @click="shomeiGo"
      >
        文書を回送します
      </button>
      <button type="button" v-if="signdesi.shomeiSend && processStep > 1" @click="closeWindow">
        画面クローズ
      </button>
      <div v-if="processStep == 1 || signdesi.shomeiGo" class="buttonQuit">
        <button type="button" @click="closeWindow">画面をクローズする</button>
      </div>

      <div v-if="infoVisible" :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }">
        {{ infoMessage }}
      </div>
    </div>
  </Suspense>
</template>

<style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  th,
  td {
    border: 1px solid #ddd;
    padding: 5px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
  .form-row {
    margin-bottom: 10px;
  }
  .c5p {
    width: 5%;
  }
  .c10p {
    width: 10%;
  }
  .c20p {
    width: 20%;
  }
  .c40p {
    width: 40%;
  }
  .c95p {
    width: 95%;
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
  .buttonB {
    margin-right: 30px;
    background-color: turquoise;
  }
  .buttonR {
    margin-right: 10px;
    background-color: #ffcccc;
  }
  .buttonQuit {
    margin-top: 40px;
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
