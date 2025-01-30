<script setup>
  import { reactive, ref, onMounted, watch } from 'vue';

  const props = defineProps({
    page: {
      required: true,
    },
    scaleSize: Number,
    pageNum: Number,
    totalPageNum: Number,
    origin: String,
  });
  const emit = defineEmits([
    'measure',
    'last-page-on',
    'first-page-on',
    'change-page-on',
    'add-text',
    'add-date',
    'add-draw',
    'add-stamp',
    'download',
  ]);

  const pdfCanvas = ref();
  const data = reactive({
    width: 0,
    height: 0,
  });
  onMounted(() => {
    setupPage(props);
  });
  watch(
    () => props.scaleSize,
    () => {
      setupPage(props); // 新しいスケール値でPDFを再描画
    }
  );

  async function setupPage(props) {
    try {
      const _page = await props.page;

      const context = pdfCanvas.value.getContext('2d');

      let scale = props.scaleSize;
      const PRINT_UNITS = 170 / 72;
      let viewport = _page.getViewport({ scale: scale, rotation: 0 });

      pdfCanvas.value.width = viewport.width * PRINT_UNITS;
      pdfCanvas.value.height = viewport.height * PRINT_UNITS;

      pdfCanvas.value.style.width = `${viewport.width}px`;
      pdfCanvas.value.style.height = `${viewport.height}px`;

      data.width = viewport.width;
      data.height = viewport.height;

      await _page.render({
        canvasContext: context,
        transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0],
        viewport,
        intent: 'display',
      }).promise;
    } catch (error) {
      console.error('Error in setupPage:', error);
    }
  }
  function onFirstPage() {
    emit('first-page-on');
  }
  function onLastPage() {
    emit('last-page-on');
  }
  function onPageChange(event) {
    const onPage = event.target.value - 1;
    const pHeight = data.height;

    emit('change-page-on', onPage, pHeight);
  }
  function zoomOut() {
    emit('measure', props.scaleSize * 0.9);
  }
  function zoomIn() {
    emit('measure', props.scaleSize * 1.1);
  }
  function addText() {
    emit('add-text');
  }
  function addDate() {
    emit('add-date');
  }
  function addDraw() {
    emit('add-draw');
  }
  function addStamp() {
    emit('add-stamp');
  }
  function download() {
    emit('download');
  }
</script>
<template>
  <div id="outerContainer">
    <div id="mainContainer">
      <div class="toolbar">
        <div id="toolbarContainer">
          <div id="toolbarViewer" class="toolbarViewer">
            <div id="toolbarViewerLeft">
              <button
                id="toolbarFirst"
                class="toolbarButton"
                title="1ページに戻ります"
                @click="onFirstPage"
              ></button>
              <button
                id="toolbarLast"
                class="toolbarButton"
                title="最終ページに飛びます"
                @click="onLastPage"
              ></button>
              <div id="toolbarPage">
                <input
                  type="number"
                  :value="pageNum + 1"
                  @change="onPageChange"
                  class="toolbarField pageNumber"
                  min="1"
                />
                <span>/ {{ totalPageNum }}</span>
              </div>
            </div>
            <div v-if="origin === 'pdfup'" id="toolbarViewerMiddle">
              <div class="splitToolbarButton">
                <button
                  id="toolbarzoomOut"
                  class="toolbarButton"
                  title="表示を縮小します"
                  @click="zoomOut"
                ></button>
                <div class="splitToolbarButtonSeparator"></div>
                <button
                  id="toolbarzoomIn"
                  class="toolbarButton"
                  title="表示を拡張します"
                  @click="zoomIn"
                ></button>
              </div>
            </div>
            <div id="toolbarViewerRight">
              <div
                v-if="origin === 'signdesi'"
                id="editorModeButtons"
                class="splitToolbarButton toggled"
                role="radiogroup"
              >
                <button
                  id="toolbaraddText"
                  class="toolbarButton"
                  title="テキスト項目を追加します"
                  @click="addText"
                ></button>
                <button
                  id="toolbaraddDate"
                  class="toolbarButton"
                  title="日付項目追加します"
                  @click="addDate"
                ></button>
                <button
                  id="toolbaraddDraw"
                  class="toolbarButton"
                  title="サイン等自由描画項目を追加します"
                  @click="addDraw"
                ></button>
                <button
                  id="toolbaraddStamp"
                  class="toolbarButton"
                  title="押印画像項目を追加します"
                  @click="addStamp"
                ></button>
              </div>
              <button
                v-if="origin !== 'pdfup'"
                id="toolbardownLoad"
                class="toolbarButton"
                title="文書をダウンロードします"
                @click="download"
              ></button>
            </div>
          </div>
        </div>
      </div>
      <div id="pageContainer" class="pdfViewer singlePageView">
        <canvas ref="pdfCanvas" class="max-w-full" />
      </div>
    </div>
  </div>
</template>
<style scoped>
  .max-w-full {
    max-width: 100%;
    border-color: black;
    border-style: solid;
    border-width: 2px;
    margin-bottom: 30px;
    margin-top: 41px;
  }
  #outerContainer {
    position: relative;
  }
  #toolbarContainer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #f0f0f0;
    padding: 2px;
    z-index: 3;
    border-color: #8f8f8f;
    border: solid;
  }
  .pdfViewer {
    margin-bottom: 20px;
  }
  #toolbarViewer {
    display: inline-flex;
    width: 100%;
  }
  .toolbarField {
    width: 40px;
  }
  .splitToolbarButton {
    display: inline-flex;
  }
  #toolbarViewerMiddle {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  #toolbarViewerRight {
    right: 1%;
    position: absolute;
  }
  #toolbarFirst {
    background-image: url('..\..\public\secondaryToolbarButton-firstPage.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbarLast {
    background-image: url('..\..\public\secondaryToolbarButton-lastPage.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbarzoomIn {
    background-image: url('..\..\public\toolbarButton-zoomIn.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbarzoomOut {
    background-image: url('..\..\public\toolbarButton-zoomOut.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbaraddText {
    background-image: url('..\..\public\toolbarButton-editorFreeText.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbaraddDate {
    background-image: url('..\..\public\toolbarButton-Calender.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbaraddDraw {
    background-image: url('..\..\public\toolbarButton-editorInk.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbaraddStamp {
    background-image: url('..\..\public\toolbarButton-editorStamp2.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    border-color: #f2f2f2;
  }
  #toolbardownLoad {
    background-image: url('..\..\public\gv-toolbarButton-download.svg');
    background-size: contain;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    margin-left: 40px;
    border-color: #f2f2f2;
  }
  #toolbarPage {
    margin-left: 20px;
    border-color: #f2f2f2;
    position: absolute;
    display: inline-flex;
  }
</style>
