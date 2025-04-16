<script setup>
	import { reactive, onMounted, onBeforeUnmount, ref } from 'vue';

	const emit = defineEmits(['cancel', 'finish']);
	const props = defineProps({
	  viewBox: { required: true },
	  scale: { required: true },
	});
	const signatureCanvas = ref();
	const paths = ref([]);
	const path = ref('');
	const drawStatus = ref('');
	const data = reactive({
	  drawing: false,
	  x: 0,
	  y: 0,
	  minX: Infinity,
	  minY: Infinity,
	  maxX: 0,
	  maxY: 0,
	});

	onMounted(() => {
	  setupEvent();
	});

	onBeforeUnmount(() => {
	  signatureCanvas.value.removeEventListener('mousedown', handleMousedown);
	  signatureCanvas.value.removeEventListener('touchstart', handleTouchStart);
	});

	function setupEvent() {
	  signatureCanvas.value.addEventListener('mousedown', handleMousedown);
	  signatureCanvas.value.addEventListener('touchstart', handleTouchStart);
	}

	function handleMousedown(event) {
	  data.x = event.offsetX;
	  data.y = event.offsetY;
	  const target = event.target;

	  handlePanStart({
	    x: data.x,
	    y: data.y,
	    target,
	    currentTarget: signatureCanvas.value,
	  });
	  signatureCanvas.value.addEventListener('mousemove', handleMousemove);
	  signatureCanvas.value.addEventListener('mouseup', handleMouseup);
	}

	function handleMousemove(event) {
	  const dx = event.offsetX - data.x;
	  const dy = event.offsetY - data.y;
	  data.x = event.offsetX;
	  data.y = event.offsetY;

	  handlePanMove({
	    x: data.x,
	    y: data.y,
	    dx,
	    dy,
	  });
	}

	function handleMouseup(event) {
	  data.x = event.offsetX;
	  data.y = event.offsetY;

	  handlePanEnd({ x: data.x, y: data.y });
	  signatureCanvas.value.removeEventListener('mousemove', handleMousemove);
	  signatureCanvas.value.removeEventListener('mouseup', handleMouseup);
	  drawStatus.value = 'draw';
	}

	function handleTouchStart(event) {
	  if (event.touches.length > 1) return;
	  const touch = event.touches[0];
	  data.x = touch.clientX;
	  data.y = touch.clientY;
	  const target = touch.target;

	  handlePanStart({ x: data.x, y: data.y, target });

	  signatureCanvas.value.addEventListener('touchmove', handleTouchmove); // { passive: false }
	  signatureCanvas.value.addEventListener('touchend', handleTouchend);
	}

	function handleTouchmove(event) {
	  event.preventDefault();
	  if (event.touches.length > 1) return;
	  const touch = event.touches[0];
	  const dx = touch.clientX - data.x;
	  const dy = touch.clientY - data.y;
	  data.x = touch.clientX;
	  data.y = touch.clientY;

	  handlePanMove({ x: data.x, y: data.y, dx, dy });
	}

	function handleTouchend(event) {
	  const touch = event.changedTouches[0];
	  data.x = touch.clientX;
	  data.y = touch.clientY;

	  handlePanEnd({ x: data.x, y: data.y });
	  signatureCanvas.value.removeEventListener('touchmove', handleTouchmove);
	  signatureCanvas.value.removeEventListener('touchend', handleTouchend);
	}

	// --------------------------- pannable end ------------------

	function handlePanStart(event) {
	  if (event.target !== event.currentTarget) {
	    data.drawing = false;
	    return;
	  }

	  data.drawing = true;
	  data.x = event.x;
	  data.y = event.y;
	  data.minX = Math.min(data.minX, data.x);
	  data.maxX = Math.max(data.maxX, data.x);
	  data.minY = Math.min(data.minY, data.y);
	  data.maxY = Math.max(data.maxY, data.y);
	  paths.value.push(['M', data.x, data.y]);
	  path.value += `M${data.x},${data.y}`;
	}

	function handlePanMove(event) {
	  if (!data.drawing) return;

	  data.x = event.x;
	  data.y = event.y;
	  data.minX = Math.min(data.minX, data.x);
	  data.maxX = Math.max(data.maxX, data.x);
	  data.minY = Math.min(data.minY, data.y);
	  data.maxY = Math.max(data.maxY, data.y);
	  path.value += `L${data.x},${data.y}`;

	  paths.value.push(['L', data.x, data.y]);
	}

	function handlePanEnd() {
	  data.drawing = false;
	}

	function finish() {
	  if (!paths.value.length) return;

	  const dx = -(data.minX - 10);
	  const dy = -(data.minY - 10);

	  const originWidth = data.maxX - data.minX + 20;
	  const originHeight = data.maxY - data.minY + 20;

	  emit('finish', {
	    width: originWidth,
	    height: originHeight,
	    path: paths.value.reduce((acc, cur) => {
	      return acc + cur[0] + (cur[1] + dx) + ',' + (cur[2] + dy);
	    }, ''),
	  });
	  drawStatus.value = 'finish';
	}

	function cancel() {
	  path.value = '';
	  paths.value = [];
	}
</script>
<template>
	<div style="height: 100%; width: 100%">
		<div
			ref="signatureCanvas"
			@panstart="handlePanStart"
			@panmove="handlePanMove"
			@panend="handlePanEnd"
			class="relative w-full h-full select-none"
		>
			<div class="absolute right-0 bottom-0 mr-4 mb-4 flex">
				<div
					style="position: absolute; left: 0px; bottom: -30px; margin: 4 auto auto 4"
				>
					<button v-if="drawStatus == 'draw'" @click="cancel" class="pm-button">
						{{$t('消')}}
					</button>
					<button v-if="drawStatus == 'draw'" @click="finish" class="pm-button">
						{{$t('完')}}
					</button>
				</div>
			</div>
			<svg style="width: 100%; height: 100%; pointer-events: none">
				<path
					stroke-width="2"
					stroke="black"
					fill="none"
					stroke-linejoin="round"
					stroke-linecap="round"
					:d="path"
				/>
			</svg>
		</div>
	</div>
</template>
<style scoped>
	.relative {
	  position: relative;
	}
	.w-full {
	  width: 100%;
	}
	.h-full {
	  height: 100%;
	}
	.select-none {
	  user-select: none;
	}
	.pm-button {
	  width: 25px;
	  height: 25px;
	  display: inline-block;
	  align-items: center;
	  justify-content: center;
	  background-color: #6fa1ff;
	  color: #fff;
	  text-align: center;
	  font-size: 13px;
	  margin-right: 7px;
	}
</style>
