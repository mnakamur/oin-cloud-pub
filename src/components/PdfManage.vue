<script setup>
  import { reactive, onMounted, ref } from 'vue';
  import { addPDF, pdfDownload } from './utils/PDF';
  import { useMsgHandler } from './utils/helper';

  import PdfPage from './PdfPage.vue';

  import { downloadData } from 'aws-amplify/storage';
  import { generateClient } from 'aws-amplify/api';

  const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();

  let pdf = '';
  const props = defineProps({
    data: {
      required: true,
      type: Object,
    },
  });
  const docData = ref({
    pdfFile: null,
    docName: '',
    pdfFileId: '',
    pages: [],
    pagesScale: [],
    numPages: 0,
  });
  const allObjects = ref([]);
  const selectedPageIndex = ref(0);
  const scaleSize = ref(0.0);
  const isModalVisible = ref(false);
  const isDownloading = ref(false);
  const docArea = ref(null);
  const emit = defineEmits(['close', 'finished']);

  let s3Level = 'protected';

  onMounted(() => {
    mountPdf();
  });

  async function mountPdf() {
    try {
      isDownloading.value = true;
      const { body, eTag } = await downloadData({
        key: props.data.createUserId + '/' + props.data.docId,
        options: { accessLevel: s3Level },
      }).result;
      docData.value.docName = props.data.docName;

      pdf = await addPDF(body, allObjects, docData);
    } catch (error) {
      showMessage('文書が保存先からダウンロードできませんでした。再度実施してください');
      errorToLambda(props.data.createUserId, props.data.docId, 'Signdesi', 'mountPdf', error);
    } finally {
      isDownloading.value = false;
    }
    scaleSize.value = docData.value.pagesScale[0];
  }

  function onMeasure(scale, pageIndex) {
    docData.value.pagesScale[pageIndex] = scale;
  }

  function selectPage(index) {
    selectedPageIndex.value = index;
  }
  function onLastPage() {
    if (docArea.value) {
      docArea.value.scrollTop = docArea.value.scrollHeight;
    }
  }
  function onFirstPage() {
    if (docArea.value) {
      docArea.value.scrollTop = 0;
    }
  }
  function onPageChange(onPage, pHeight) {
    docArea.value.scrollTop = onPage * (pHeight + 3);
  }
  function showModal() {
    isModalVisible.value = true;
  }
  const handlePdfDownload = async () => {
    await pdfDownload(docData.value.pdfFile, docData.value.docName);
  };

  function contentsClose() {
    setTimeout(() => {
      emit('close');
    }, 1000);
  }
  function contentsDelete() {
    window.confirm('文書とルート情報を削除してもよろしいですか');
    setTimeout(() => {
      emit('close');
    }, 1000);
  }
</script>
<template>
  <div class="main">
    <div style="margin: 5px">
      <button @click="contentsClose">管理画面に戻る</button>
    </div>
    <div v-if="scaleSize !== 0" class="docArea" ref="docArea">
      <h4>文書名：{{ data.docName }} <br /></h4>
      <div
        v-for="(page, pageIndex) in docData.pages"
        :key="pageIndex"
        class="selected-page"
        @mousedown="() => selectPage(pageIndex)"
        @touchstart="() => selectPage(pageIndex)"
        @download="handlePdfDownload"
      >
        <div :class="['each-page', { 'selected-pdf': pageIndex == selectedPageIndex }]">
          <pdf-page
            :page="docData.pages[pageIndex]"
            :scaleSize="scaleSize"
            :pageNum="pageIndex"
            :totalPageNum="docData.pages.length"
            origin="pdfmanage"
            @last-page-on="onLastPage"
            @first-page-on="onFirstPage"
            @change-page-on="onPageChange"
            @download="handlePdfDownload"
          />
        </div>
      </div>
    </div>
  </div>
  <div v-if="isDownloading" class="blinking-bar">文書をダウンロード中です</div>
  <div v-if="infoVisible" :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }">
    {{ infoMessage }}
  </div>
</template>
<style scoped>
  h4 {
    margin-top: 5px;
    margin-bottom: 0px;
  }
  p {
    margin-top: 2px;
    margin-bottom: 2px;
  }
  .main {
    position: fixed;
    background-color: white;
    z-index: 1;
    max-width: 98%;
    height: 95%;
    border: solid 2px #0000ff;
    top: 30px;
    margin: 0% 2%;
  }

  .dragArea {
    margin-top: 10px;
    max-width: auto;
    float: left;
  }
  .docArea {
    float: left;
    margin: 15px 30px;
    overflow: scroll;
    overflow-y: auto;
    max-height: 93%; /*85%*/
    max-width: 100%; /*90%*/
  }
  .pdfdelbutton {
    float: right;
    background-color: red;
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
  .explan_text {
    font-size: 14px;
    text-align: left;
  }
  .slider-blue {
    --slider-connect-bg: #3475e0;
    --slider-tooltip-bg: #3475e0;
    --slider-handle-ring-color: #3475e0;
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
  .blinking-bar {
    width: 50%;
    height: 40px;
    position: fixed;
    top: 80%;
    left: 5%;
    background-color: #3498db63;
    animation: blink 1s linear infinite;
    display: flex;
    justify-content: center; /* Centers horizontally */
    align-items: center;
  }

  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
