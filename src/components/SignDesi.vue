<script setup>
  import { reactive, onMounted, ref } from 'vue';
  import { readAsImage } from './utils/asyncReader';
  import { addPDF } from './utils/PDF';
  import { generateId, useMsgHandler } from './utils/helper';
  import { errorToLambda } from './utils/lambdahelper';

  import PdfPage from './PdfPage.vue';
  import ObjectContainer from './ObjectContainer.vue';

  import { downloadData } from 'aws-amplify/storage';
  import { generateClient } from 'aws-amplify/api';
  import { createContents } from '../graphql/mutations';
  import ExplanationSigndesi from './ExplanationSigndesi.vue';

  const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();
  const client = generateClient();

  let pdf = '';
  const imgDummy = '\imgDummy.png';

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
    pagesViewports: [],
    numPages: 0,
  });

  const allObjects = ref([]);
  const selectedPageIndex = ref(0);
  const signatureCanvas = reactive({
    isShow: false,
  });
  const opacity = ref(1);
  const scaleSize = ref(0.0);
  const isModalVisible = ref(false);
  const isDownloading = ref(false);
  const processStep = ref(1);
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
  function updateObject(objectId, payload) {
    allObjects.value = allObjects.value.map((object) => {
      if (object.page == selectedPageIndex.value && object.id === objectId) {
        return { ...object, ...payload };
      } else {
        return object;
      }
    });
  }

  function deleteObject(objectId) {
    allObjects.value = allObjects.value.filter(
      //(object) => object.page == this.selectedPageIndex && object.id !== objectId
      (object) => object.id !== objectId
    );
  }
  function showModal() {
    isModalVisible.value = true;
  }

  const filteredObjects = (pageIndex) => {
    return allObjects.value.filter((object) => object.page === pageIndex);
  };

  async function addImage(file) {
    const img = await readAsImage(imgDummy);
    const id = generateId();
    const { width, height } = img;

    const object = {
      id,
      type: 'image',
      width,
      height,
      originx: window.innerWidth / 2.0 / scaleSize.value,
      originy: 32,
      x: window.innerWidth / 2.0 / scaleSize.value,
      y: window.innerHeight / 2.0 / scaleSize.value,
      payload: img,
      file: file,
      page: selectedPageIndex.value,
      scale: scaleSize.value,
      status: 'entrying',
    };
    allObjects.value.push(object);
  }
  async function addDrawObj() {
    let drawPath = '';

    const id = generateId();
    const drawObject = {
      id,
      path: drawPath,
      type: 'drawing',
      originx: window.innerWidth / 2 / scaleSize.value,
      originy: 32,
      x: window.innerWidth / 4 / scaleSize.value,
      y: window.innerHeight / 1.8,
      height: 100,
      width: 300,
      scale: scaleSize.value,
      page: selectedPageIndex.value,
      status: 'entrying',
    };
    allObjects.value.push(drawObject);
    signatureCanvas.isShow = false;
  }
  function addTextElement(text, x, y) {
    const id = generateId();

    const textObject = {
      id,
      text,
      type: 'txt',
      originx: x,
      originy: y,
      x,
      y,
      size: 14,
      lineHeight: 1.1,
      width: 360,
      height: 25,
      fontFamily: 'ipaexg',
      page: selectedPageIndex.value,
      scale: scaleSize.value,
      lineCount: 1,
      status: 'entrying',
    };
    allObjects.value.push(textObject);
  }
  function addDateElement(text, x, y) {
    const id = generateId();

    const dateObject = {
      id,
      text,
      type: 'date',
      originx: x,
      originy: y,
      x,
      y,
      size: 14,
      fontFamily: 'ipaexg',
      lineHeight: 1.1,
      width: 126,
      height: 35,
      page: selectedPageIndex.value,
      scale: scaleSize.value,
      lineCount: 1,
      objComment: text,
      status: 'entrying',
    };
    allObjects.value.push(dateObject);
  }

  async function contentsSave() {
    if (allObjects.value.length == 0) {
      showMessage('署名入力が何も設定されていません');
      return;
    }
    const unfinObj = allObjects.value.filter((object) => object.status != 'fin');
    if (unfinObj.length > 0) {
      showMessage('署名入力が完了していない要素があります');
      return;
    }
    for (const object of allObjects.value) {
      let scale = 1.0;
      const page = await pdf.getPage(object.page + 1);
      let viewport = page.getViewport({ scale: scale });

      const pageHeight = viewport.height;
      try {
        await client.graphql({
          query: createContents,
          variables: {
            input: {
              pdfId: props.data.docId,
              id: props.data.docId + props.data.rootIndex + '-' + object.id,
              seq: object.id,
              type: object.type,
              page: object.page,
              width: object.width,
              height: object.height,
              x: object.x,
              Y: object.y,
              scale: object.scale,
              size: object.size,
              fontFamily: object.fontFamily,
              lineHeight: object.lineHeight,
              lineCount: object.lineCount,
              lines: object.lines,
              text: object.text,
              path: object.path,
              pageHeight: pageHeight,
              objComment: object.objComment,
              date: object.date,
              shomeiContentId: props.data.docId + props.data.rootIndex,
            },
          },
        });
      } catch (error) {
        console.log(error, object);
        showMessage('署名設定が保存できませんでした。最初からやり直してください');
        errorToLambda(props.data.createUserId, props.data.docId, 'Signdesi', 'contentsSave', error);
        throw error;
      }
      //}
    }
    showMessage('署名設定が保存できました。ルート設定に戻ります', 'info');
    processStep.value += 1;
    emit('finished', props.data.rootIndex);
    contentsClose();
  }
  function contentsClose() {
    setTimeout(() => {
      emit('close');
    }, 2000);
  }
</script>
<template>
  <div class="main">
    <h3>署名時入力設定</h3>
    <div v-if="processStep == 1" style="margin-bottom: 5px">
      <h4 style="margin: 5px auto">
        署名時の入力する領域を設定します。
        <button @click="showModal">操作説明を見る</button>
      </h4>
      <ExplanationSigndesi
        v-if="isModalVisible"
        @close="isModalVisible = false"
        :isVisible="isModalVisible"
      />
    </div>
    <div id="dragArea" class="dragArea">
      <div v-if="processStep == 1" style="margin-top: 10px">
        <button class="buttonR" @click="contentsSave">署名設定を保存する</button>
        <button @click="contentsClose" style="margin-left: 77px">入力設定にもどる</button>
      </div>
    </div>
    <div v-if="scaleSize !== 0" class="docArea" ref="docArea">
      <h4>文書名：{{ data.docName }} <br />署名者：{{ data.shomeiName }} 様</h4>
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
            origin="signdesi"
            @measure="(payload) => onMeasure(payload, pageIndex)"
            @last-page-on="onLastPage"
            @first-page-on="onFirstPage"
            @change-page-on="onPageChange"
            @add-text="addTextElement('改行して行数、文字数を調整してください', 100, 252)"
            @add-date="addDateElement('署名日付を入力してください', 200, 272)"
            @add-draw="addDrawObj"
            @add-stamp="addImage(imgDummy)"
          />
          <div class="object">
            <object-container
              v-for="(object, objectIndex) in filteredObjects(pageIndex)"
              :key="objectIndex"
              @update="(payload) => updateObject(object.id, payload)"
              @delete="() => deleteObject(object.id)"
              :id="object.id"
              :file="object.file"
              :payload="object.payload"
              :text="object.text"
              :originx="object.originx"
              :originy="object.originy"
              :x="object.x"
              :y="object.y"
              :size="object.size"
              :width="object.width"
              :height="object.height"
              :lineHeight="object.lineHeight"
              :fontFamily="object.fontFamily"
              :opacity="opacity"
              :pageScale="docData.pagesScale[pageIndex]"
              :pageHeight="docData.pagesViewports[pageIndex].height"
              :pageWidth="docData.pagesViewports[pageIndex].width"
              :type="object.type"
              :path="object.path"
              :scale="object.scale"
              :lineCount="object.lineCount"
              :objComment="object.objComment"
              :date="object.date"
              :origin="'signdesi'"
              :object="object"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="isDownloading" class="blinking-bar">文書をダウンロード中です</div>
    <div v-if="infoVisible" :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }">
      {{ infoMessage }}
    </div>
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
    width: 100%;
    height: 95%;
    border: solid 2px #0000ff;
    top: 30px;
  }
  .dragArea {
    margin-top: 10px;
    max-width: auto;
    float: left;
  }
  .docArea {
    float: right;
    margin-right: 30px;
    margin-bottom: 30px;
    overflow-x: scroll;
    overflow-y: scroll;
    max-height: 89%; /*85%*/
    max-width: 100%; /*90%*/
  }
  .buttonR {
    margin-right: 10px;
    background-color: #ffcccc;
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
