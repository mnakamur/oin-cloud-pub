<script setup>
	import { ref, onMounted } from 'vue';
	import router from '../router';
	import { getBunsyo } from '../graphql/queries';
	import { generateClient } from 'aws-amplify/api';
	import { onLastPage, onFirstPage, onPageChange } from './utils/scrollFunctions';
	import { addPDF, pdfDownload } from './utils/PDF';
	import PdfPage from './PdfPage.vue';
	import { errorToLambda } from './utils/lambdahelper';
	import { useMsgHandler } from './utils/helper';
	const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();
	import { fetchAuthSession } from 'aws-amplify/auth';
	import { useI18n } from 'vue-i18n'
	   const { t } = useI18n()

	const client = generateClient();
	const docData = ref({
	  pdfFile: null,
	  docName: '',
	  pdfFileId: '',
	  pages: [],
	  pagesScale: [],
	  numPages: 0,
	});
	const pdfUrl = ref(null);
	const routeNo = ref({});
	const scaleSize = ref(1.0);
	const createUserName = ref();
	const createUserId = ref();
	const allObjects = ref([]);
	const selectedPageIndex = ref(0);
	const isDownloading = ref(false);
	const dlButtonStatus = ref(true);

	onMounted(async () => {
	  const idrouteNo = router.currentRoute.value.params.param.split(',');
	  docData.value.pdfFileId = idrouteNo[0];
	  routeNo.value = idrouteNo[1];
	  pdfUrl.value = idrouteNo[2];
	  fetchBunsyo();
	  const fetchAuthS = await fetchAuthSession();
	});

	async function fetchBunsyo() {
	  const bunsyo = await client.graphql({
	    query: getBunsyo,
	    variables: { id: docData.value.pdfFileId },
	  });
	  docData.value.docName = bunsyo.data.getBunsyo.docName;
	  createUserName.value = bunsyo.data.getBunsyo.userName;
	  createUserId.value = bunsyo.data.getBunsyo.createUser;

	  const pdfResponse = await fetch(bunsyo.data.getBunsyo.docRef);
	  if (pdfResponse.status >= 400) {
	    showMessage(
	      '文書が期限切れで、ダウンロードできませんでした。作成者に連絡し再配信を依頼してください',
	      'error',
	      7000
	    );
	    shomeiButtonStatus.value = false;
	    return;
	  }
	  isDownloading.value = true;
	  const blob = await pdfResponse.blob();

	  try {
	    await addPDF(blob, allObjects, docData);
	  } catch (error) {
	    dlButtonStatus.value = false;
	    showMessage('文書がダウンロードできませんでした', 'error', 5000);
	    errorToLambda(
	      createUserId.value,
	      bunsyo.data.getBunsyo.pdfId,
	      'SignComplete',
	      'fetchBunsyo',
	      error
	    );
	  } finally {
	    isDownloading.value = false;
	  }
	}

	function onMeasure(scale, pageIndex) {
	  docData.value.pagesScale[pageIndex] = scale;
	}
	const handlePdfDownload = async () => {
	  await pdfDownload(docData.value.pdfFile, docData.value.docName);
	};
	function closeWindow() {
	  const userConfirmed = window.confirm(t('画面を終了してもよいですか？'));
	  if (userConfirmed) {
	    router.replace({ name: 'signin' });
	    window.close();
	  }
	}
</script>
<template>
	<div class="headexplain">
		<h3>{{$t('文書の署名が完了しました')}}</h3>
		<p>
			<strong
				>{{$t('電子署名された文書はダウンロードして手元に保存してください。')





				}}<br />{{$t('当該文書が見れるのは、文書が回送されてから7日間です。')}}</strong
			>
		</p>
		<h4>{{$t('文書名')}}：{{ docData.docName }}</h4>
		<h4>{{$t('発信者')}}：{{ createUserName }}</h4>
	</div>
	<div class="opearea">
		<button v-if="dlButtonStatus" class="buttonB" @click="handlePdfDownload">
			{{$t('文書をダウンロードします')}}
		</button>
		<button class="button" @click="closeWindow">{{$t('画面クローズ')}}</button>
	</div>
	<div class="docarea">
		<h4>{{$t('署名文書')}}</h4>
		<div
			v-for="(page, pageIndex) in docData.pages"
			:key="pageIndex"
			class="selected-page"
		>
			<div
				:class="['each-page', { 'selected-pdf': pageIndex == selectedPageIndex }]"
			>
				<pdf-page
					:page="docData.pages[pageIndex]"
					:scaleSize="scaleSize"
					@measure="(payload) => onMeasure(payload, pageIndex)"
					:pageNum="pageIndex"
					:totalPageNum="docData.pages.length"
					origin="signComplete"
					@last-page-on="onLastPage"
					@first-page-on="onFirstPage"
					@change-page-on="onPageChange"
					@download="handlePdfDownload"
				/>
				<div class="object"></div>
			</div>
		</div>
		<div v-if="isDownloading" class="blinking-bar">
			{{$t('文書をダウンロード中です')}}
		</div>
		<div
			v-if="infoVisible"
			:class="{ 'info-popup': infoVisible, 'error-popup': errorVisible }"
		>
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
	table {
	  width: 100%;
	  border-collapse: collapse;
	  margin-bottom: 10px;
	}
	.headeexplain {
	  width: 30%;
	}
	.opearea {
	  margin-top: 10px;
	  float: left;
	  width: 30%;
	}
	.docarea {
	  overflow-y: scroll;
	  float: right;
	  margin-top: 20px;
	  float: right;
	  margin-right: 10%;
	  left: auto;
	  width: auto;
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
	.button {
	  margin-right: 10px;
	  margin-top: 10px;
	}
	.buttonB {
	  margin-right: 30px;
	  background-color: turquoise;
	  margin-top: 10px;
	}
	th,
	td {
	  border: 1px solid #ddd;
	  padding: 8px;
	  text-align: left;
	}

	th {
	  background-color: #f2f2f2;
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
	  border: 1px solid #ff0000;
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
