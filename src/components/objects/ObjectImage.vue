<script setup>
import { reactive, computed, ref, onMounted, onBeforeUnmount,watch } from "vue";

const props = defineProps({
  operation: { required: true },
  objtype: { required: true },
});
const emit = defineEmits([
  "panstart",
  "panmove",
  "panend",
  "sizeplus",
  "sizehplus",
  "sizelplus",
  "sizeminus",
  "sizehminus",
  "sizelminus",
  "deleteobj",
  "fontchange",
  "fixeddesi",
]);
const operation = ref(props.operation)
const font = ref("ipaexg");
const signatureContainer = ref();
const data = reactive({
  x: 0,
  y: 0,
});

let moveOperation = computed(() => props.operation === "move");

watch(operation, (newValue) => {
  if (newValue === 'stop') {
        moveOperation = false;
        signatureContainer.value.removeEventListener("mousedown", handleMousedown);
        signatureContainer.value.removeEventListener("mousemove", handleMousemove)
      }
})

let isMouseDown = false;
onMounted(() => {
  setupEvent();
});
/*
onBeforeUnmount(() => {
  signatureContainer.value.removeEventListener("mousedown", handleMousedown);
  signatureContainer.value.removeEventListener("touchstart", handleTouchStart);
});
*/
function setupEvent() {
  signatureContainer.value.addEventListener("mousedown", handleMousedown);
  signatureContainer.value.addEventListener("touchstart", handleTouchStart);
}

function handleMousedown(event) {
  if (props.operation === "stop") return;
  isMouseDown = true;
  data.x = event.clientX;
  data.y = event.clientY;

  const target = event.target;
  emit("panstart", {
    x: data.x,
    y: data.y,
    target,
    currentTarget: signatureContainer.value,
  });

  signatureContainer.value.addEventListener("mouseup", handleMouseup);
  signatureContainer.value.addEventListener("mousemove", handleMousemove);

  signatureContainer.value.removeEventListener("mousedown", handleMousedown);
}

function handleMousemove(event) {
  if (!isMouseDown) return;

  const dx = event.clientX - data.x;
  const dy = event.clientY - data.y;
  data.x = event.clientX;
  data.y = event.clientY;

  emit("panmove", {
    x: data.x,
    y: data.y,
    dx,
    dy,
  });
}

function handleMouseup(event) {
  isMouseDown = false;

  data.x = event.clientX;
  data.y = event.clientY;

  emit("panend", { x: data.x, y: data.y });

  signatureContainer.value.removeEventListener("mousemove", handleMousemove);
  signatureContainer.value.removeEventListener("mouseup", handleMouseup);
}

function handleTouchStart(event) {
  if (event.touches.length > 1) return;
  const touch = event.touches[0];
  data.x = touch.clientX;
  data.y = touch.clientY;
  const target = touch.target;

  emit("panstart", { x: data.x, y: data.y, target });

  signatureContainer.value.addEventListener("touchmove", handleTouchmove); // { passive: false }
  signatureContainer.value.addEventListener("touchend", handleTouchend);
}

function handleTouchmove(event) {
  event.preventDefault();
  if (event.touches.length > 1) return;
  const touch = event.touches[0];
  const dx = touch.clientX - data.x;
  const dy = touch.clientY - data.y;
  data.x = touch.clientX;
  data.y = touch.clientY;

  emit("panmove", { x: data.x, y: data.y, dx, dy });
}

function handleTouchend(event) {
  const touch = event.changedTouches[0];
  data.x = touch.clientX;
  data.y = touch.clientY;

  emit("panend", { x: data.x, y: data.y });

  signatureContainer.value.removeEventListener("touchmove", handleTouchmove);
  signatureContainer.value.removeEventListener("touchend", handleTouchend);
}

function fixeddesi() {
  //event.target.parentNode.style.display = "none";
  //moveOperation = "false";
  emit("fixeddesi");
  //signatureContainer.value.removeEventListener("mousedown", handleMousedown);
  //signatureContainer.value.removeEventListener("mousemove", handleMousemove);
}
function fontChange() {
  emit("fontchange", font.value);
}
</script>
<template>
  <div v-if="props.operation != 'stop'"
    ref="signatureContainer"
    @mousedown.passive="handleMousedown"
    @touchstart.passive="handleTouchStart"
    :class="[
      'absolute w-full h-full operation signature-Container',
      { 'cursor-grab': moveOperation },
    ]"
  >
    <div v-if="objtype == 'drawing' ||objtype == 'txt'  " 
    :class="objtype === 'drawing' ? 'buttons' : objtype === 'txt' ? 'buttons_t' : ''">
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('sizehplus')">
        ↓
      </button>
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('sizehminus')">
        ↑
      </button>
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('sizelminus')" >
        ←
      </button>  
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('sizelplus')">
        →
      </button>
      <!--<div v-if="objtype == 'txt'" class="font-button">-->
        <select v-if="objtype == 'txt'" v-model="font" @change="fontChange" class="font-select">
          <option value="ipaexg">IPAゴシック</option>
          <option value="ipaexm,serif">IPA 明朝</option>
          <!--<option value="Helvetica">Helvetica</option>
          <option value="Courier">Courier</option>
          <option value="Times-Roman">Times-Roman</option>-->
        </select>
      <!--</div>-->
      <button class="pm-button w-1 left-10 bottom-0" @click="fixeddesi">
        完
      </button>
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('deleteobj')">
        ×
      </button>
    </div>
    <div v-else class="buttons">
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('sizeplus')">
        +
      </button>
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('sizeminus')">
        -
      </button>
      <button class="pm-button w-1 left-10 bottom-0" @click="fixeddesi">
        完
      </button>
      <button class="pm-button w-1 left-0 bottom-0" @click="$emit('deleteobj')">
        ×
      </button>
      <!--<div v-if="objtype == 'txt'" class="font-button">
        <select v-if="objtype == 'txt'" v-model="font" @change="fontChange" class="font-select">
          <option value="ipaexg">IPAゴシック</option>
          <option value="ipaexm,serif">IPA 明朝</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Courier">Courier</option>
          <option value="Times-Roman">Times-Roman</option>
        </select>
      </div>-->
    </div>
  </div>
</template>
<style scoped>
.operation {
  background-color: rgba(0, 0, 0, 0.3);
}
.resize-border {
  position: absolute;
  border-style: dashed;
  border-color: #718096;
}
.resize-corner {
  position: absolute;
  width: 0.7rem;
  height: 0.7rem;
  background-color: #3475e0;
  border-radius: 9999px;
}
.cursor-grab {
  cursor: grab;
}
.absolute {
  position: absolute;
}
.h-full {
  height: 100%;
}
.h-1 {
  height: 1px;
}
.w-full {
  width: 100%;
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
.left-10 {
  margin-left: 10px;
}
.right-0 {
  right: 0px;
}
.bottom-0 {
  bottom: 0px;
}
.border-l {
  border-left-width: 1px;
}
.border-r {
  border-right-width: 1px;
}
.border-t {
  border-top-width: 1px;
}
.border-b {
  border-bottom-width: 1px;
}
.cursor-ew-resize {
  cursor: ew-resize;
}
.cursor-ns-resize {
  cursor: ns-resize;
}
.cursor-nwse-resize {
  cursor: nwse-resize;
}
.cursor-nesw-resize {
  cursor: nesw-resize;
}
.buttons {
  display: inline-flex;
  margin-top: 5px;
  position: absolute;
  bottom: -15px;
}
.buttons_t {
  display: inline-flex;
  margin-top: 5px;
  position: absolute;
  bottom: -23px;
}
.pm-button {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #6fa1ff;
  color: #fff;
  text-align: center;
  font-size: 13px;
  margin-right: 3px;
}
.pmc-button {
  width: 40px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #6fa1ff;
  color: #fff;
  text-align: center;
  font-size: 6px;
  margin-right: 3px;
}
.font-button {
  /*width:auto;*/
  /*width: 40px;*/
  height: 25px;
  /*display:inline-flexbox;*/
  align-items: center;
  justify-content: center;
  /*background-color: #6fa1ff;*/
  color: #fff;
  text-align: center;
  font-size: 9px;
  margin-right: 3px;
}
/*   
    .comment-area
    {
     font-size:8px;
     width:150px;
     margin-top:3px;
     display:inline-flex;
     position:absolute;
     bottom:-37px;
    }
    /*
    .font-label {
  /*display: inline-block;
  width:40px;
  font-size:9px;
  /*margin-right: 10px; ラベルとセレクトボックスの間のスペース 
    }
*/
.font-select {
  display: inline-block;
  
}
</style>
