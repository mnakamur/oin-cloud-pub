<script setup>
  import { reactive, ref } from 'vue';
  import { addPDF, verifyInPdf } from './utils/PDF';
  import { onLastPage, onFirstPage, onPageChange, useMsgHandler } from './utils/helper';
  import PdfPage from './PdfPage.vue';

  import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
  import { uploadData } from 'aws-amplify/storage';
  import { generateClient } from 'aws-amplify/api';
  import { createBunsyo } from '../graphql/mutations';
  import { errorToLambda } from './utils/lambdahelper';
  import router from '../router';

  const client = generateClient();
  const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();

  const props = defineProps({
    pdf: {
      required: true,
      type: String,
    },
  });
  const docData = ref({
    pdfFile: null,
    docName: '',
    pdfFileId: '',
    pages: [],
    pagesScale: [],
    pagesViewports: [],
    numPages: 0,
  });
  const allObjects = ref([]);
  const selectedPageIndex = ref(0);
  const scaleSize = ref(1.0);
  const signRoot = reactive({
    isShow: false,
  });
  const processStep = ref(1);
  const userProfile = ref(true);
  let createUserAttr = {};

  let s3Level = 'protected';

  fetchUserAttributes().then((result) => {
    createUserAttr.email = result.email;
    createUserAttr.userId = result.sub;
    if (!result.name || result.name.trim() === '') {
      userProfile.value = false;
    }
    if (result['custom:Company_name']) {
      createUserAttr.name = result.name + '(' + result['custom:Company_name'] + ')';
    } else {
      createUserAttr.name = result.name;
    }
  });

  async function fileChanged() {
    const input_pdf = file.files[0];

    const pdf_inputStatus = await verifyInPdf(input_pdf);

    if (pdf_inputStatus == false) {
      showMessage('この文書は仕様上読み込めません。詳しくはPDFの条件をご覧ください');
      errorToLambda(
        createUserAttr.userId,
        docData.value.pdfFileId,
        'pdfEditor',
        'pdfinput',
        infoMessage.value
      );
      return;
    }
    docData.value = {
      pdfFile: null,
      docName: '',
      pdfFileId: '',
      pages: [],
      pagesScale: [],
      pagesViewports: [],
      numPages: 0,
    };
    let pdfAddResult = await addPDF(input_pdf, allObjects, docData);
    if (pdfAddResult == false) {
      showMessage('当処理では読み込めない文書です');
      errorToLambda(
        createUserAttr.userId,
        docData.value.pdfFileId,
        'pdfEditor',
        'addPDF',
        infoMessage.value
      );
      return;
    }

    processStep.value += 1;
  }

  function onMeasure(scale, pageIndex) {
    scaleSize.value = scale;
  }

  function selectPage(index) {
    selectedPageIndex.value = index;
  }

  async function makeRoot() {
    await uploadpdftoS3()
      .then(() => {
        signRoot.isShow = true;
        router.push({ name: 'signroot', query: { pdfId: docData.value.pdfFileId } });
      })
      .catch((error) => {
        console.error('An error occurred during PDF upload:', error);
      });
  }

  async function uploadpdftoS3() {
    docData.value.pdfFileId =
      createUserAttr.userId + '-' + 'pdf' + new Date().getTime().toString(16);

    try {
      const S3resultPDF = await uploadData({
        key: createUserAttr.userId + '/' + docData.value.pdfFileId,
        data: docData.value.pdfFile,
        options: {
          accessLevel: s3Level,
        },
      }).result;
      showMessage('文書が保存できました。ルート作成に行きます', 'info', 3000);
    } catch (error) {
      showMessage('文書が保存できませんでした。ファイルを確認してください');
      errorToLambda(
        createUserAttr.userId,
        docData.value.pdfFileId,
        'pdfEditor',
        'uploadpdftoS3',
        infoMessage.value
      );
      throw error;
    }
    const credentials = await fetchAuthSession();

    await client
      .graphql({
        query: createBunsyo,
        variables: {
          input: {
            pdfId: docData.value.pdfFileId,
            id: docData.value.pdfFileId,
            createUser: createUserAttr.userId,
            userName: createUserAttr.name,
            userEmail: createUserAttr.email,
            docName: docData.value.docName,
            pageNum: docData.value.numPages,
            shomeiLength: 0,
            bunStatus: 'create',
            identityId: credentials.identityId,
          },
        },
      })
      .then((result) => {})
      .catch((error) => {
        showMessage('文書データが保存できませんでした');
        errorToLambda(
          formatToJST(new Date()),
          createUserAttr.userId,
          docData.value.pdfFileId,
          'pdfEditor',
          'createBunsyo',
          error
        );
        throw error;
      });
  }
</script>
<template>
  <div style="margin-bottom: 4px; position: relative">
    <div v-if="!userProfile" style="color: red">
      プロフィールが設定されていません.事前に設定してください
    </div>
    <div id="dragArea" class="dragArea">
      <div>
        <label for="file" class="fileLabel"> PDF文書を読み込んでください </label>
        <a class="htmlLink" href="/guide/oin-cloudDoc.html#pdfspec" target="_blank" rel="noopener"
          >登録できるPDF文書</a
        >
      </div>
      <div>
        <input id="file" name="file" type="file" class="buttonB" @change="fileChanged(this)" />
      </div>
      <div v-if="processStep > 1" style="font-weight: bold; margin-top: 10px">
        この文書名で回送します。必要に応じて名前を変更してください<br />
        文書名:
        <input
          id="doc-name"
          type="text"
          v-model="docData.docName"
          style="width: 200px; margin-bottom: 10px; border-style: groove"
        />
      </div>
      <div v-if="processStep > 1">
        <button class="buttonR" @click="makeRoot">文書を保存して署名ルートを設定します。</button>
      </div>
    </div>
    <div class="docArea">
      <div v-if="processStep > 1" style="width: 100%; overflow: scroll; margin-top: -20px">
        対象文書
        <div
          v-for="(page, pageIndex) in docData.pages"
          :key="pageIndex"
          class="selected-page"
          @mousedown="() => selectPage(pageIndex)"
          @touchstart="() => selectPage(pageIndex)"
        >
          <div :class="['each-page', { 'selected-pdf': pageIndex == selectedPageIndex }]">
            <pdf-page
              :page="docData.pages[pageIndex]"
              :scaleSize="scaleSize"
              :pageNum="pageIndex"
              :totalPageNum="docData.pages.length"
              origin="pdfup"
              @measure="(payload) => onMeasure(payload, pageIndex)"
              @last-page-on="onLastPage"
              @first-page-on="onFirstPage"
              @change-page-on="onPageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="infoVisible" :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }">
    {{ infoMessage }}
  </div>
</template>
<style scoped>
  .dragArea {
    width: 50%;
    height: 200px;
    margin-top: 10px;
    float: left;
    /*min-height: 53vh;*/
  }
  .docArea {
    max-width: 100%;
    float: right;
    margin-top: -30px;
  }
  .fileLabel {
    margin-left: 0px;
  }
  .htmlLink {
    margin-left: 40px;
  }

  .selected-pdf {
    box-shadow: 0 0 0 1px rgba(52, 117, 224, 0.5);
  }
  .selected-page {
    width: 100%;
    overflow: scroll;
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

  .slider-blue {
    --slider-connect-bg: #3475e0;
    --slider-tooltip-bg: #3475e0;
    --slider-handle-ring-color: #3475e0;
  }
  .buttonB::file-selector-button {
    background-color: turquoise;
    margin-top: 5px;
  }
  .buttonR {
    margin-right: 10px;
    background-color: #ffcccc;
  }
  .info-popup {
    position: fixed;
    z-index: 10;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #cce5ff;
    padding: 10px;
    border: 1px solid #ff0000;
  }
  .error-popup {
    position: fixed;
    z-index: 90;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ffcccc;
    padding: 10px;
    border: 1px solid #ff0000;
  }
</style>
