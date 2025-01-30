<script setup>
  import { reactive, ref, onMounted } from 'vue';
  import { fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';
  import { useMsgHandler } from './utils/helper';
  import { errorToLambda } from './utils/lambdahelper';

  const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();

  const createUser = ref();

  const attributes = reactive({
    companyName: '',
    department: '',
    post: '',
    phoneNumber: '',
  });

  onMounted(async () => {
    await fetchCreateUserAttributes();
  });
  async function fetchCreateUserAttributes() {
    const result = await fetchUserAttributes();
    attributes.companyName = result['custom:Company_name'];
    attributes.department = result['custom:Department'];
    attributes.post = result['custom:Post'];
    attributes.phoneNumber = result.phone_number;
    createUser.value = result.name;
  }
  async function updateUserProfile() {
    const userAttributes = {};

    if (attributes.companyName) userAttributes['custom:Company_name'] = attributes.companyName;
    if (attributes.department) userAttributes['custom:Department'] = attributes.department;
    if (attributes.post) userAttributes['custom:Post'] = attributes.post;
    if (attributes.phoneNumber)
      userAttributes['phone_number'] = formatPhoneNumber(attributes.phoneNumber);
    if (createUser.value) userAttributes['name'] = createUser.value;

    try {
      await updateUserAttributes({
        userAttributes: userAttributes,
      });
      showMessage('プロフィール更新が完了しました', 'info');
    } catch (error) {
      console.error('Failed to update user attributes', error);
      showMessage('プロフィール更新ができませんでした');
      errorToLambda(createUser.value, 'nopdf', 'UserProfile', 'updateUserAttributes', error);
    }
  }
  function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      return;
    }
    const sanitizedNumber = phoneNumber.replace(/[^+\d]/g, '');

    if (sanitizedNumber.startsWith('+81')) {
      return sanitizedNumber;
    }

    if (sanitizedNumber.length !== 10 && sanitizedNumber.length !== 11) {
      showMessage('電話番号として正しくありません');
      throw new Error();
    }

    if (sanitizedNumber.startsWith('0')) {
      return '+81' + sanitizedNumber.slice(1);
    }
    showMessage('電話番号として正しくありません');
    throw new Error();
  }
</script>
<template>
  <div>
    <h4>作成者：{{ createUser }}</h4>
  </div>
  <div>
    <h4>プロフィール</h4>
    <form @submit.prevent="updateUserProfile">
      <div>
        <label class="stlabel" for="createUser_name">氏名:</label>
        <input class="stinput" type="text" id="createUser_name" v-model="createUser" />
      </div>
      <div>
        <label class="stlabel" for="company_name">会社名:</label>
        <input class="stinput" type="text" id="company_name" v-model="attributes.companyName" />
      </div>

      <div>
        <label class="stlabel" for="department">部署名:</label>
        <input class="stinput" type="text" id="department" v-model="attributes.department" />
      </div>

      <div>
        <label class="stlabel" for="post">役職名:</label>
        <input class="stinput" type="text" id="post" v-model="attributes.post" />
      </div>
      <div>
        <label class="stlabel" for="phone_number">電話番号:</label>
        <input class="stinput" type="text" id="phone_number" v-model="attributes.phoneNumber" />
      </div>

      <button class="button-class" type="submit">更新</button>
    </form>
    <div v-if="infoVisible" :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }">
      {{ infoMessage }}
    </div>
    <router-link to="/" tag="button" class="button-class">作成画面に戻る</router-link>
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
  .stlabel {
    width: 20%;
    margin-bottom: 10px;
    display: inline-block;
  }
  .stinput {
    width: 40%;
    margin-bottom: 10px;
  }
  .button {
    margin-right: 10px;
  }
  .buttonD {
    margin-left: 30px;
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
    display: inline-block;
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
    margin-bottom: 10px;
  }
  .button-class:hover {
    background-color: #0056b3;
  }
</style>
