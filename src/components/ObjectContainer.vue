<script setup>
  import { reactive, ref, onMounted, watch } from 'vue';
  import ObjectImage from './objects/ObjectImage.vue';
  import SignatureCanvasdraw from './SignatureCanvasdraw.vue';
  import { readAsImage, readAsDataURL } from './utils/asyncReader';
  import { errorToLambda } from './utils/lambdahelper';
  import { useMsgHandler } from './utils/helper';
  const props = defineProps({
    id: { required: true },
    payload: { required: true },
    originx: { required: true },
    originy: { required: true },
    x: { required: true },
    y: { required: true },
    file: { required: true },
    width: { required: true },
    height: { required: true },
    pageScale: { required: true },
    pageHeight: { required: true },
    pageWidth: { required: true },
    opacity: { required: true },
    type: { required: true },
    path: { required: false, default: null },
    text: { required: true },
    size: { required: true },
    fontFamily: { required: true },
    lineHeight: { required: true },
    scale: { required: true },
    lineCount: { required: true },
    objComment: { required: false },
    date: { required: false },
    origin: { required: true },
    object: { required: true, type: Object },
  });

  const emit = defineEmits(['update', 'delete', 'clear']);

  const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();

  const canvasImage = ref();
  const signature = ref(null);
  const textarea = ref('');
  const operation = ref('input');
  const commentIn = ref('');
  const fileinputBox = ref(false);
  const inputComplete = ref('close');
  const textAreaHeight = ref(props.height);
  const textAreaWidth = ref(props.width);
  const formattedHTML = ref('↓↑で行数と     ←→で文字領域を調整してください');
  const signDate = ref(props.date);
  const grabbing = ref('');
  if (props.origin == 'signdesi') {
    grabbing.value = true;
  }
  const data = reactive({
    startX: null,
    startY: null,
    directions: [],
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
    pannableFunction: null,
  });

  onMounted(() => {
    setCanvas(props);
  });

  watch(
    () => props.payload,
    () => {
      setCanvas(props);
    }
  );

  function setCanvas(props) {
    let { width, height } = props;
    if (props.type == 'image') {
      let imgsrc = new Image(width, height);
      if (props.origin == 'signdesi') {
        imgsrc = props.payload;
      } else {
        imgsrc.src = props.payload;
      }
      canvasImage.value.width = width;
      canvasImage.value.height = height;
      canvasImage.value.getContext('2d').drawImage(imgsrc, 0, 0, width, height);

      if (props.file && !['image/jpeg', 'image/png'].includes(props.file.type)) {
        canvasImage.value.toBlob((blob) => {
          emit('update', {
            file: blob,
          });
        });
      }
    }
  }

  function handlePanStart(event) {
    if (operation.value === '') {
      data.startX = event.x;
      data.startY = event.y;
      if (event.target === event.currentTarget) {
        operation.value = 'move';
      }
    }
  }

  function handlePanMove(event) {
    const _dx = (event.x - data.startX) / props.pageScale;
    const _dy = (event.y - data.startY) / props.pageScale;
    if (operation.value === 'move') {
      data.dx = _dx;
      data.dy = _dy;
    } else if (operation.value === 'scale') {
      if (data.directions.includes('left')) {
        data.dx = _dx;
        data.dw = -_dx;
      }
      if (data.directions.includes('top')) {
        data.dy = _dy;
        data.dh = -_dy;
      }
      if (data.directions.includes('right')) {
        data.dw = _dx;
      }
      if (data.directions.includes('bottom')) {
        data.dh = _dy;
      }
    }
  }

  function handlePanEnd() {
    if (operation.value === 'move') {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
      });
      data.dx = 0;
      data.dy = 0;
    } else if (operation.value === 'scale') {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        width: props.width + data.dw,
        height: props.height + data.dh,
      });

      data.dx = 0;
      data.dy = 0;
      data.dw = 0;
      data.dh = 0;
      data.directions = [];
    }
    operation.value = '';
  }
  function sizePlus() {
    if (props.type === 'date') {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        width: (props.size + 1) * 10,
        height: props.height * 1.02,
        size: props.size + 1,
      });
    } else if (props.type === 'image') {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        width: props.width * 1.1,
        height: props.height * 1.1,
      });
    } else {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        scale: props.scale * 1.1,
      });
    }
    //この下いるのかな
    data.dx = 0;
    data.dy = 0;
    data.dw = 0;
    data.dh = 0;
    data.directions = [];
  }
  function sizeHPlus() {
    if (props.type === 'txt') {
      formattedHTML.value = formattedHTML.value.slice(0, 6) + '<br>' + formattedHTML.value.slice(6);
      const lines = formattedHTML.value.split('<br>');
      textAreaHeight.value += props.size * 1.1;
      emit('update', {
        text: formattedHTML.value,
        lineCount: lines.length,
        lines: lines,
        height: textAreaHeight.value,
      });
    } else {
      emit('update', {
        y: props.y + data.dy,
        height: props.height * 1.1,
      });
    }
  }
  function sizeHMinus() {
    if (props.type === 'txt') {
      let lines = formattedHTML.value.split('<br>');
      if (lines.length == 1) {
        return;
      } else {
        formattedHTML.value = formattedHTML.value.replace('<br>', '');
        textAreaHeight.value -= props.size * 1.1;
        lines = formattedHTML.value.split('<br>');
        emit('update', {
          text: formattedHTML.value,
          lineCount: lines.length,
          lines: lines,
          height: textAreaHeight.value,
        });
      }
    } else {
      emit('update', {
        y: props.y + data.dy,
        height: props.height * 0.9,
      });
    }
  }
  function sizeLPlus() {
    if (props.type === 'txt') {
      textAreaWidth.value += props.size * 1.1;
      emit('update', {
        width: textAreaWidth.value,
      });
    } else {
      emit('update', {
        x: props.x + data.dx,
        width: props.width * 1.1,
      });
    }
  }

  function sizeLMinus() {
    if (props.type === 'txt') {
      textAreaWidth.value =
        textAreaWidth.value > 100 ? textAreaWidth.value - props.size * 1.1 : 100;
      //textAreaWidth.value -= props.size*1.1
      emit('update', {
        width: textAreaWidth.value,
      });
    } else {
      emit('update', {
        x: props.x + data.dx,
        width: props.width * 0.9,
      });
    }
  }
  function sizeMinus() {
    if (props.type === 'txt') {
      calculateTextWidth();

      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        width: textAreaWidth.value > 32 ? textAreaWidth.value : 32,
        height: textAreaHeight.value,
        size: props.size - 1,
      });
      textAreaHeight.value = parseFloat(textAreaHeight.value) - props.lineCount + 'px';
    } else if (props.type === 'date') {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        width: (props.size - 1) * 11,
        height: props.height > 25 ? props.height - 1.3 : 25,
        size: props.size > 8 ? props.size - 1 : 8,
      });
    } else if (props.type === 'image') {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        width: props.width * 0.9,
        height: props.height * 0.9,
      });
    } else {
      emit('update', {
        x: props.x + data.dx,
        y: props.y + data.dy,
        scale: props.scale * 0.9,
      });
    }
    data.dx = 0;
    data.dy = 0;
    data.dw = 0;
    data.dh = 0;
    data.directions = [];

    operation.value = '';
  }

  function handleFontChange(font) {
    calculateTextWidth();
    emit('update', {
      fontFamily: font,
      width: textAreaWidth.value,
      height: textAreaHeight.value,
    });
  }

  function calculateTextWidth() {
    const textArea = textarea.value;
    if (textArea) {
      textAreaWidth.value = textArea.scrollWidth;
      textAreaHeight.value = textArea.scrollHeight;
    }
  }

  function handleBlur_signdo() {
    const textContent = textarea.value;
    const lines = textarea.value.split('\n');
    const lineLengths = lines.map((line) => line.length);
    const maxCharLength = Math.max(...lineLengths);

    const fontsize = Math.floor(Math.min(props.width / maxCharLength, props.height / lines.length));

    emit('update', {
      text: textContent,
      lines: lines,
      size: fontsize,
      status: 'fin',
    });
    operation.value = 'stop';
  }
  function handleBlur_C(event) {
    emit('update', {
      objComment: event.target.value,
    });
  }
  function handleDate() {
    emit('update', {
      date: formattedSignDate(signDate.value),
      size: Math.floor((props.size * 10) / 11),
      status: 'fin',
    });
    operation.value = 'stop';
  }
  function formattedSignDate(signDate) {
    const date = new Date(signDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }

  function handleKeydown(event) {
    const textarea = event.target;
    const lines = textarea.value.split('\n');
    if (event.key === 'Enter' && lines.length >= props.lineCount) {
      event.preventDefault();
    }
  }

  function updateCont(event) {
    operation.value = 'stop';
    inputComplete.value = 'complete';
    emit('update', {
      status: 'fin',
    });
  }

  async function uploadImage(e) {
    const file = e.target.files[0];
    if (file) {
      await addImage(file);
      inputComplete.value = addImage(file) ? 'finish' : inputComplete.value;
    }
  }

  async function addImage(file) {
    try {
      const url = await readAsDataURL(file);
      const img = await readAsImage(url);

      emit('update', {
        payload: img.currentSrc,
        file: file,
      });
      fileinputBox.value = false;
      return true;
    } catch (error) {
      errorToLambda('', props.id, 'ObjectContainer', 'addimage', error);
      showMessage('イメージ読込ができませんでした。再度実施してください');
      return false;
    }
  }

  function updateSignature(event) {
    emit('update', {
      width: event.width,
      height: event.height,
      path: event.path,
      scale: event.scale,
      status: 'fin',
    });
    operation.value = 'stop';
  }
  function desiFinish() {
    const finStatus = desiCheck(props);

    if (finStatus == true) {
      operation.value = 'stop';
      grabbing.value = false;
      commentIn.value = 'readonly';
      emit('update', {
        status: 'fin',
      });
    } else {
      showMessage(
        '署名入力設定に入力されていない項目があります<br>・位置や大きさは正しいですか<br>・入力説明文は入れましたか'
      );
    }
  }
  function desiCheck(props) {
    if (
      props.objComment &&
      props.x >= -10 &&
      props.y >= 30 &&
      props.x + props.width + 10 <= props.pageWidth * props.pageScale &&
      props.y + props.height - 30 <= props.pageHeight * props.pageScale
    ) {
      return true;
    } else {
      return false;
    }
  }
</script>

<template>
  <!--sign-design define area-->
  <div v-if="origin == 'signdesi'">
    <div
      v-if="type == 'txt'"
      class="text-widget"
      :class="{ 'cursor-grab': grabbing === true }"
      :style="{
        transform: `translate(${x + data.dx}px, ${y + data.dy}px)`,
        height: textAreaHeight + 'px',
        width: textAreaWidth + 'px',
      }"
    >
      <div
        class="text-area"
        ref="textarea"
        :contenteditable="operation == 'stop'"
        :style="{
          fontSize: `${size}px`,
          fontFamily: `${fontFamily}`,
          height: textAreaHeight + 'px',
          width: textAreaWidth + 'px',
        }"
        v-html="formattedHTML"
      ></div>
      <object-image
        :operation="operation"
        class="text-button"
        :objtype="type"
        @panstart="handlePanStart"
        @panmove="handlePanMove"
        @panend="handlePanEnd"
        @sizehplus="sizeHPlus"
        @sizelplus="sizeLPlus"
        @sizehminus="sizeHMinus"
        @sizelminus="sizeLMinus"
        @deleteobj="$emit('delete')"
        @fontchange="handleFontChange"
        @fixeddesi="desiFinish"
      />
      <input
        type="text"
        class="comment-area-text"
        name="comments"
        maxlength="40"
        rows="1"
        placeholder="入力説明文を40字以内で記入してください"
        @blur="handleBlur_C"
        :readonly="commentIn === 'readonly'"
      />
    </div>
    <div
      v-if="type == 'date'"
      class="border_s date-widget"
      :class="{ 'cursor-grab': grabbing === true }"
      :style="{
        transform: `translate(${x + data.dx}px, ${y + data.dy}px)`,
        height: `${height}px`,
        width: `${width}px`,
      }"
    >
      <object-image
        :operation="operation"
        class="text-button"
        :objtype="type"
        :id="id"
        @panstart="handlePanStart"
        @panmove="handlePanMove"
        @panend="handlePanEnd"
        @sizeplus="sizePlus"
        @sizeminus="sizeMinus"
        @deleteobj="$emit('delete')"
        @fontchange="handleFontChange"
        @fixeddesi="desiFinish"
      />
      <input
        type="date"
        id="date"
        name="sign-date"
        :value="signDate"
        readonly
        :style="{
          fontSize: `${size}px`,
          fontFamily: `${fontFamily}`,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        }"
      />
      <input
        type="text"
        class="comment-area-date"
        name="comments"
        maxlength="40"
        rows="1"
        value="署名日付を入力してください"
        @blur="handleBlur_C"
        :readonly="commentIn === 'readonly'"
      />
    </div>
    <div
      v-if="type == 'image' || type == 'drawing'"
      class="border_s absolute left-0 top-0 select-none"
      :class="{ 'cursor-grab': grabbing === true }"
      :style="{
        height: `${height}px`,
        width: `${width}px`,
        transform: `translate(${x + data.dx}px, ${y + data.dy}px)`,
      }"
    >
      <object-image
        :operation="operation"
        :objtype="type"
        :id="id"
        @panstart="handlePanStart"
        @panmove="handlePanMove"
        @panend="handlePanEnd"
        @sizeplus="sizePlus"
        @sizehplus="sizeHPlus"
        @sizelplus="sizeLPlus"
        @sizeminus="sizeMinus"
        @sizehminus="sizeHMinus"
        @sizelminus="sizeLMinus"
        @deleteobj="$emit('delete')"
        @fontchange="handleFontChange"
        @fixeddesi="desiFinish"
      />

      <canvas v-if="type == 'image'" class="w-full h-full" ref="canvasImage" />

      <svg v-else-if="type == 'drawing'" ref="signature" :viewBox="`0 0 ${width} ${height}`">
        <path
          stroke-width="3"
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke="black"
          fill="none"
          :d="object.path"
        />
      </svg>
      <input
        type="text"
        class="comment-area-is"
        name="comments"
        maxlength="40"
        rows="1"
        placeholder="入力説明文を40字以内で記入してください"
        @blur="handleBlur_C"
        :readonly="commentIn === 'readonly'"
      />
    </div>
  </div>
  <!--signdo define area-->
  <div v-else-if="origin == 'signdo'">
    <div
      v-if="type == 'txt'"
      class="text-widget"
      :style="{
        top: `${y}px`,
        left: `${x}px`,
      }"
    >
      <textarea
        class="text-area-signdo"
        :class="{ border_d: operation == 'input' }"
        :style="{
          fontSize: `${size}px`,
          fontFamily: `${fontFamily}`,
          width: `${width}px`,
          height: `${height}px`,
        }"
        @blur="handleBlur_signdo"
        @keydown.enter="handleKeydown"
        v-model="textarea"
      >
      </textarea>
      <p v-if="operation == 'input'" class="objComment_text" :style="{ marginTop: `${height}px` }">
        {{ objComment }}
      </p>
    </div>
    <div
      v-if="type == 'date'"
      class="date-widget"
      :class="{ border_d: operation == 'input' }"
      :style="{
        top: `${y}px`,
        left: `${x}px`,
        height: `${height}px`,
        width: `${width}px`,
      }"
    >
      <input
        type="date"
        id="date"
        name="sign-date"
        v-model="signDate"
        @blur="handleDate"
        :style="{
          fontSize: `${size}px`,
          fontFamily: `${fontFamily}`,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        }"
      />
      <p v-if="operation == 'input'" class="objComment_date">{{ objComment }}</p>
    </div>

    <div
      v-if="type == 'image' || type == 'drawing'"
      class="absolute select-none"
      :class="{ border_d: operation == 'input' }"
      :style="{
        width: `${width}px`,
        height: `${height}px`,
        left: `${x}px`,
        top: `${y}px`,
      }"
    >
      <canvas v-if="type == 'image'" class="w-full h-full" ref="canvasImage" />
      <div v-if="type == 'image'" class="button-container">
        <button
          v-if="inputComplete == 'finish'"
          class="pm-button left-0 bottom-0"
          @click="updateCont"
        >
          完
        </button>
        <input
          v-if="operation == 'input'"
          type="file"
          class="fileinput"
          name="image"
          accept=".png"
          @change="uploadImage"
        />
        <p v-if="operation == 'input'" class="objComment_image">{{ objComment }}</p>
      </div>
      <signature-canvasdraw
        v-if="type == 'drawing'"
        ref="signature"
        :viewBox="`${x} ${y} ${width} ${height}`"
        :scale="`${scale}`"
        @finish="updateSignature"
      />
      <p v-if="type === 'drawing' && operation === 'input'" class="objComment_draw">
        {{ objComment }}
      </p>
    </div>
  </div>
  <div
    v-if="infoVisible"
    :class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }"
    v-html="infoMessage"
  ></div>
</template>

<style scoped>
  .text-area {
    border: solid red;
    position: absolute;
    background-color: #fff;
    cursor: text;
    line-height: 1.1;
    white-space: nowrap;
  }
  .text-area-signdo {
    border: dotted red;
    position: absolute;
    cursor: text;
    line-height: 1.1;
    resize: none;
    white-space: pre;
    overflow: hidden;
    background-color: transparent;
    padding-top: 0px;
    outline: none; /* フォーカス時のデフォルト outline を非表示にする */
  }
  .text-widget {
    position: absolute;
    left: 0px;
    top: 0px;
    user-select: text;
  }
  .date-widget {
    position: absolute;
    left: 0px;
    top: 0px;
  }
  .absolute {
    position: absolute;
  }
  .select-none {
    user-select: text;
  }

  .cursor-grab {
    cursor: grab;
  }
  .text-button {
    min-width: 30px;
    max-width: 50%;
  }
  .border_d {
    border: dotted red;
  }
  .border_s {
    border: solid red;
  }
  .comment-area-text {
    font-size: 12px;
    width: 300px;
    margin-top: 3px;
    display: inline-flex;
    position: absolute;
    bottom: -45px;
  }
  .comment-area-is {
    font-size: 12px;
    width: 300px;
    margin-top: 3px;
    display: inline-flex;
    bottom: -37px;
  }
  .comment-area-date {
    font-size: 12px;
    width: 300px;
    margin-top: 18px;
    display: inline-flex;
  }
  /* signdo */
  .w-full {
    width: 100%;
  }
  .h-full {
    height: 100%;
  }
  .button-container {
    display: flex;
    align-items: center;
  }
  .fileinput {
    width: auto;
    height: auto;
    font-size: 10px;
    margin-left: 10px;
    position: relative;
  }
  .objComment_draw {
    font-size: 12px;
    width: 410px;
    bottom: -60px;
    position: absolute;
    color: red;
  }
  .objComment_image {
    font-size: 12px;
    width: 210px;
    position: absolute;
    bottom: -2px;
    color: red;
  }
  .objComment_text {
    font-size: 12px;
    width: 300px;
    display: inline-flex;
    position: absolute;
    color: red;
  }
  .objComment_date {
    font-size: 12px;
    width: 210px;
    margin-top: 3px;
    position: absolute;
    color: red;
  }
  .pm-button {
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #6fa1ff;
    color: #fff;
    text-align: center;
    font-size: 13px;
    margin-right: 3px;
  }
  .w-1 {
    width: 1px;
  }
  .top-0 {
    top: 0px;
  }
  .left-0 {
    left: 0px;
  }
  .right-0 {
    right: 0px;
  }
  .bottom-0 {
    bottom: 0px;
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
  .error-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ffcccc;
    padding: 10px;
    border: 1px solid #ff0000;
  }
</style>
