<script setup>
import { ref, onMounted} from 'vue'
import router from '../router'
import { updateShomei,updateContents } from "../graphql/mutations";
import { onLastPage, onFirstPage, onPageChange } from './utils/scrollFunctions'
import { getBunsyo,getShomei,contentsByShomei } from "../graphql/queries";
import { generateClient } from 'aws-amplify/api';
import { addPDF,pdfDownload } from './utils/PDF'
import { errorToLambda,invokeLambda } from './utils/lambdahelper';
import { useMsgHandler,getSignatureFromUrl } from "./utils/helper";
import Signstatus from "./SignStatus.vue";
import { uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from "aws-amplify/auth";

import PdfPage from './PdfPage.vue'
import ObjectContainer from './ObjectContainer.vue'
import ExplanationSigndo from './ExplanationSigndo.vue';

const client = generateClient();
const { errorVisible, infoVisible, infoMessage, showMessage } = useMsgHandler();
const docData = ref({
  pdfFile: null,
  docName: '',
  pdfFileId: '',
  pages:[],
  pagesScale:[],
  numPages:0,
});
let createUserAttr = {};
const routeNo = ref({});
const shomeiId = ref({});
const scaleSize = ref(1.0);
const opacity = ref(1);
const commentToAuthor = ref('');
const commentToSigner = ref('');
const shomeiButtonStatus = ref(true)
const rootShowStatus = ref(false)
const isModalVisible = ref(false);
const isDownloading = ref(false);
const shomeisyaName = ref('');
const allObjects = ref([])

const selectedPageIndex = ref(0)
const inputExplanationVisible = ref(false)
let decoSignedUrl;
let shomeiRes;
let s3Level = 'public'
let s3folder = ""

onMounted(async() => {
  const idRouteNo = router.currentRoute.value.params.param.split(',');
  docData.value.pdfFileId = idRouteNo[0];
  routeNo.value = idRouteNo[1];
  shomeiId.value = idRouteNo[2];
  await fetchBunsyo();
  const fetchAuthS = await fetchAuthSession();
})

async function fetchBunsyo(){
  isDownloading.value = true
  const bunsyo = await client.graphql({
                query: getBunsyo,
                variables: { id: docData.value.pdfFileId }
                })
    
              
   docData.value.docName = bunsyo.data.getBunsyo.docName
   createUserAttr.userId   = bunsyo.data.getBunsyo.createUser
   createUserAttr.userName = bunsyo.data.getBunsyo.userName
   decoSignedUrl = decodeURIComponent(bunsyo.data.getBunsyo.docRef)
   const urlSig = getSignatureFromUrl(decoSignedUrl)
  
   if (urlSig != shomeiId.value)
  {    showMessage('既に署名されているか、署名する文書ではないようです、画面を閉じてください','error',5000)
       shomeiButtonStatus.value = false
    　  return   
  } 
  if (routeNo.value > 0 &&
    bunsyo.data.getBunsyo.bunStatus !=  `signed,${parseInt(routeNo.value, 10) - 1}`)
   {
    
    showMessage('署名する文書ではないようです、画面を閉じてください','error',5000)
       shomeiButtonStatus.value = false
    　  return  
   } 
  
  try {
  const shomeiData = await fetchShomei() 
  
  if (shomeiData != false)
  { 
    shomeisyaName.value = shomeiData.name;
    const pdfResponse = await fetch(bunsyo.data.getBunsyo.docRef);
   
  if (pdfResponse.status >　400)
  {  showMessage('文書が期限切れで、ダウンロードできませんでした。作成者に連絡し再配信を依頼してください','error',7000)　
     shomeiButtonStatus.value = false;
     return　
  }
  const blob = await pdfResponse.blob();
  
  let pdf = await addPDF(blob,allObjects, docData) 
    commentToSigner.value = shomeiData.commentToSigner ? shomeiData.commentToSigner : commentToSigner.value;           
  
    if (shomeiData.shomeiNaiyo !=　'signinput')
  {  return;  }
  else
  {  await fetchContents();  }       
  }
  }
catch (error) {
  　　　showMessage('文書が保存先からダウンロードできませんでした。作成者に連絡してください')　
        errorToLambda(createUserAttr.userId,bunsyo.data.getBunsyo.pdfId,'Signdo','fetchBunsyo',error)
  }
 finally {
        isDownloading.value = false;
      }   
}

async function fetchShomei(){
  const shomei = await client.graphql({
                query: getShomei,
                variables: { id: docData.value.pdfFileId + routeNo.value }
                })
 
  if (shomei.data.getShomei.shomeiStatus == 'signed' || shomei.data.getShomei.shomeiStatus == 'reject')
  {    showMessage('文書はすでに処理されています 画面を閉じてください','error',5000)
       shomeiButtonStatus.value = false
    　  return false;   
  } 
  else
  { return shomei.data.getShomei}             
                   
}
async function updateDynamoShomei(status){
  try {
    const updateSData = {
      id: docData.value.pdfFileId + routeNo.value,
      commentToAuthor: commentToAuthor.value,
      shomeiStatus:status, 
       };
      
     shomeiRes = await client.graphql({
        query:updateShomei,
        variables: { input: updateSData },
    }); 
  }
  catch (error) {
  showMessage('署名データが保存できませんでした。')  
  errorToLambda(createUserAttr.userId,bunsyo.data.getBunsyo.pdfId,'Signdo','updateDynamoShomei',error)
  }
}
async function fetchContents(){
  var ContentsRes; 
  const shomeiContentId = docData.value.pdfFileId + routeNo.value;
  try {
  ContentsRes = await client.graphql({
         query:contentsByShomei,
         variables: {shomeiContentId:shomeiContentId },
         nextToken:null 
                 })
  
  } catch (error) {
  showMessage('入力データが呼び出すことができませんでした。最初から読み直してください')    
  errorToLambda(createUserAttr.userId,docData.value.pdfFileId,'Signdo','fetchContents',error)
  throw error;
  }

  while (ContentsRes.data.contentsByShomei.nextToken) {
    
    try{ const nextContentsRes = await client.graphql({
        query: contentsByShomei,
        variables: { shomeiContentId:shomeiContentId,
            nextToken: ContentsRes.data.contentsByShomei.nextToken
        } 
    });

    ContentsRes = nextContentsRes;

  }
  catch (error) {
  showMessage('入力データが呼び出すことができませんでした。最初から読み直してください')   
  errorToLambda(createUserAttr.userId,docData.value.pdfFileId,'Signdo','fetchContents_nextContents',error)
  }

} 
 
if (ContentsRes.data.contentsByShomei.items.length > 0)
    { inputExplanationVisible.value = true;
      contentstoObj(ContentsRes.data.contentsByShomei.items) 
      
    }            
}
function contentstoObj(items){
  for (const item of items){
    const object = {
            id:item.id,
            type:item.type,
            width:item.width,
            height:item.height,
            text:item.text,
            x: item.x,
            y: item.Y,
            path:item.path,
            page: item.page,
            scale:item.scale,
            size:item.size,
            lineHeight:item.lineHeight,
            fontFamily:item.fontFamily,
            lineCount:item.lineCount,
            pageHeight:item.pageHeight,
            objComment:item.objComment,
            date:item.date,
            status:'set'
        }
        allObjects.value.push(object)
  }
  }   
const filteredObjects = (pageIndex) => {
  return allObjects.value.filter((object) => object.page === pageIndex);
}
const formattedObjects=()=>{
  const typeMapping = {
    txt: '文字入力',
    image: '画像入力',
    date: '日付入力',
    drawing: '描画入力'
  };
  return allObjects.value.map
        (obj => ({
          page: obj.page + 1 ,
          formattedType: typeMapping[obj.type] || obj.type,
          objComment: obj.objComment,
          lineCount:obj.lineCount
        }))
      .sort((a, b) => a.page - b.page);
}
function onMeasure(scale, pageIndex) {
    docData.value.pagesScale.value[pageIndex] = scale
}

function selectPage(index) {
    selectedPageIndex.value = index
    
}
function updateObject(objectId, payload) {
    allObjects.value = allObjects.value.map((object) => {
      
        //if (object.page == selectedPageIndex.value && object.id === objectId) {
        if (object.id === objectId) {  

            return { ...object, ...payload }
        } else {
            return object
        }
    })
    
}

async function shomeiDone(){
  if (shomeiButtonStatus.value == false){ return}
  const unfinObj = allObjects.value.filter((object) => object.status != 'fin');
    if(allObjects.value.length > 0 && unfinObj.length > 0)
    { 
      showMessage('署名入力が完了していない要素があります')   
      return
    }
  const userConfirm = shomeiConfirm("承認")
  if (userConfirm == false){ return}
  
  shomeiButtonStatus.value = false;  
  s3folder = decoSignedUrl.match(/protected\/([^\/]+)\//);;
  
　const otc_res = await objectToContents()
  if (otc_res == true) 
　{var shomeiKms_res = await shomeiKms()}

  if (shomeiKms_res !== true || otc_res !== true)
{showMessage('署名依頼を行えませんでした。','error',7000)
errorToLambda(createUserAttr.userId,docData.value.pdfFileId,'Signdo','shomeiDone')}
  }

  async function shomeiKms()
{
  
  let lambdaRes = await invokeLambda('shomeiPdfSign',{ pdfId: docData.value.pdfFileId,routeNo:routeNo.value,createUserId:createUserAttr.userId,s3folder:s3folder[1] })
  if (lambdaRes.statusCode && lambdaRes.statusCode < 400) {
    　 showMessage('署名依頼をしました','info') 
       docData.value.docName += ":署名依頼済み"   
       shomeiButtonStatus.value = false;
       return true
      } else {
        showMessage('署名依頼を行えませんでした。','error',7000)
        errorToLambda(createUserAttr.userId,docData.value.pdfFileId,'Signdo','shomeiKms',error)
        shomeiButtonStatus.value = false;
        return false
      }  
}  

async function objectToContents(){
  
  if (!allObjects.value){
    return true
  }
  for (const object of allObjects.value){

  let updateCData
  
  if (object.type == 'image'){
      const IMGfilename = docData.value.pdfFileId + 'img' + new Date().getTime().toString(16)
     
  let S3resultImg    
    try {
     S3resultImg = await uploadData({
    key: createUserAttr.userId + '/' + IMGfilename,
    data: object.payload,
    options: {
      accessLevel: s3Level
        }
      }).result;
   
    updateCData ={
      id:object.id,
      S3imgKey:IMGfilename,
      file:object.file.name,
      fileType:object.file.type
    }
    } catch (error) {
  showMessage('画像ファイル保存ができませんでした。もう一度読ませてください')
  return　false　　
    }
  }  
  else
   {  
     updateCData ={
      id:object.id,
      width:object.width,
      height:object.height,
      x:object.x,
      Y:object.y,
      text:object.text,
      lines:object.lines,
      lineCount:object.lineCount,
      size:object.size,
      scale:object.scale,
      path:object.path,
      date:object.date,
     }
    }
    try {  
    const conResult = await client.graphql({
      query: updateContents,
      variables:{ input:updateCData }
      })
    
  } 
  catch(error) {
    showMessage('入力データが保存ができませんでした。もう一度入力してください')
    console.log(error);
    return false
    }
   }
   return true 
}
async function rejectDoc() {
if (shomeiButtonStatus.value == false){ return}
if (!commentToAuthor.value)
{　showMessage('却下時は「発信者へのメッセージ」に理由を記載してください。','info')　　
  　return    
} 
const userConfirm = shomeiConfirm("却下")
  if (userConfirm == false){ return}
shomeiButtonStatus.value = false
await updateDynamoShomei('reject') 
let s3folder = decoSignedUrl.match(/protected\/([^\/]+)\//);
let lambdaRes = await invokeLambda('shomeiReject',{ pdfId: docData.value.pdfFileId,route:routeNo.value,id:createUserAttr.userId,s3folder:s3folder[1] })
if (lambdaRes.statusCode && lambdaRes.statusCode < 400)  
   { showMessage('文書を却下して発信者に戻しました。','info')
   　docData.value.docName += ":却下済み" 　
     shomeiButtonStatus.value = false;
   }
else
   {
    showMessage('文書を却下できませんでした。')
    errorToLambda(createUserAttr.userId.value,docData.value.pdfFileId,'Signdo','rejectDoc',lambdaRes)
    shomeiButtonStatus.value = false;
   }
}

 
const handlePdfDownload = async () => {
      await pdfDownload(docData.value.pdfFile, docData.value.docName);
    };
function rootShow(){
  rootShowStatus.value = true
}
function closeSignStatus(){
  rootShowStatus.value = false
}     
function closeWindow() {
  const userConfirmed = window.confirm("画面を終了してもよいですか？");
  if (userConfirmed) {
    router.replace({name:'signin'})
    window.close();
  }
}
function shomeiConfirm(status) {
  const userConfirmed = window.confirm(`文書を${status}します\nよろしければOKを押してください`);
  if (userConfirmed) {
    　return true
         } 
     else 
     {return false}    
  } 
  function showModal() {
    isModalVisible.value = true;
  }     
</script>
<template>
 <div class="container"> 
 <div v-if = "shomeiButtonStatus">
    <h3> {{ shomeisyaName }} 様</h3>
    <p>文書の内容を確認してください。<strong>文書が見れるのは送付されてから7日間です。</strong>
    <button @click="showModal">操作説明を見る</button><br/>  
      <ExplanationSigndo
        v-if="isModalVisible"
        @close="isModalVisible = false"
        :isVisible="isModalVisible"
      />
       <div v-if="inputExplanationVisible" class="comment_input">
         入力内容がありますので、それぞれの入力コメントに沿って入力してください
         <div v-for="(item, index) in formattedObjects(index)" :key="index">
         <p>ページ
            <span class="red_text">{{ item.page }}</span>
            に
            <span class="red_text">{{ item.formattedType }}</span> 
            の入力があります。内容は  
            <span class="red_text">{{ item.objComment }}</span>
            です。
            <span v-if="item.formattedType === '文字入力'">
            <span class="red_text">{{ item.lineCount }}</span>
            行入力できます。文字の大きさは入力された文字数で自動的に調整します    
        　　</span>
      　　　</p>
         </div>
      </div>
       文書内容を確認し、OKであれば承認してください。電子的に署名されます<br>
       却下の必要がある場合は「発信者へのメッセージ」に理由を記載して
       却下ボタンを押してください
    </p>
  </div>  
    <h4 :style="shomeiButtonStatus ? {} : { color: 'blue', fontSize: '20px' }">文書名：{{docData.docName}}</h4>
    <h4>発信者：{{createUserAttr.userName}}</h4>
   <div class="opearea">
    　<h4 style="float:left">ルート情報確認</h4>
    　<button class="button" @click="rootShow">ルート確認</button>

    <div v-if="commentToSigner" class="comment_signer">
      <h4>発信者からのメッセージ</h4>
      <p>{{ commentToSigner }}</p>  
    </div>
    <div>
      <h4>発信者へのメッセージ</h4>
      <textarea class="comment_author" v-model="commentToAuthor"></textarea>
    </div>
    <button type="button" v-if = "shomeiButtonStatus" class="buttonB" @click="shomeiDone">承認・署名する</button>
    <button type="button" v-if = "shomeiButtonStatus" class="buttonR" @click="rejectDoc">却下する</button>
    <button type="button" v-if = "shomeiButtonStatus" class="buttonD" @click="handlePdfDownload">署名前文書をダウンロード</button>
    <button type="button" v-if="!shomeiButtonStatus" class="button" @click="closeWindow">画面クローズ</button>
  
  </div>
  <signstatus v-if="rootShowStatus"
        :pdfId="docData.pdfFileId"
        :origin="'signdo'"
        :routeNo="routeNo"
        @close="closeSignStatus"
        class="rootstatus"
        />  
  <div class="docArea">
            <div
                v-for="(page, pageIndex) in docData.pages"
                :key="pageIndex"
                class="selected-page"
                @mousedown="() => selectPage(pageIndex)"
                @touchstart="() => selectPage(pageIndex)"
            >
                <div :class="['each-page', { 'selected-pdf': pageIndex == selectedPageIndex }]">
                    <pdf-page :page="docData.pages[pageIndex]" :scaleSize=scaleSize @measure="(payload) => onMeasure(payload, pageIndex)" 
                      :pageNum=pageIndex :totalPageNum=docData.pages.length origin='signdo'
                      @last-page-on="onLastPage" @first-page-on="onFirstPage" @change-page-on="onPageChange" @download="handlePdfDownload"/>
                    <div
                        class="object">
                    
              <ObjectContainer
                            v-for="(object, objectIndex) in filteredObjects(pageIndex)"
                            :key="objectIndex"
                            @update="(payload) => updateObject(object.id, payload)"
                            @delete="() => deleteObject(object.id)"
                            @enableediting="() => enableEditing()"
                            :id="object.id"
                            :file="object.file"
                            :payload="object.payload"
                            :text="object.text"
                            :originx="object.originx"
                            :originy="object.originy"
                            :x="object.x/object.scale"
                            :y="object.y/object.scale"
                            :size="object.size"
                            :width="object.width/object.scale"
                            :height="object.height/object.scale"
                            :lineHeight="object.lineHeight"
                            :fontFamily="object.fontFamily"
                            :opacity="opacity"
                            :pageScale="docData.pagesScale[pageIndex]"
                            :type="object.type"
                            :path="object.path"
                            :scale="object.scale"
                            :lineCount="object.lineCount"
                            :objComment="object.objComment"
                            :date="object.date"
                            :origin="'signdo'"
                            :object="object"
                        />  
                    </div>
                </div>
            </div>
                   
      <div v-if="isDownloading" class="blinking-bar">文書をダウンロード中です</div>  
      <div v-if="infoVisible" :class="{'info-popup': infoVisible, 'error-popup': errorVisible}">
      {{ infoMessage }}
      </div>
</div>
</div>
   
</template>

<style scoped>
h4
{
 margin-top:5px;
 margin-bottom:0px;
}
p{
    margin-top:2px;
    margin-bottom:2px;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
.opearea {
    margin-top:5px;
    float:left;
    width:25%
  }
 .docArea {
    float: right;
    margin-top:20px;
    margin-right: 30px;
    margin-bottom: 30px;
    overflow-x: scroll;
    overflow-y: scroll;
    max-height: 89%; /*85%*/
    max-width: 100%; /*90%*/
  }  
.selected-pdf {
    box-shadow: 0 0 0 1px rgba(52, 117, 224, 0.5);
}
.selected-page{
    width:100%;
    overflow:hidden;
}
.each-page{
    position:relative;
    box-shadow: 2px 2px 2px rgba(0,0,0,0.4);
    margin-bottom:1px;
}
.object{
    position:absolute;
    top:10px;
    left:10px;
    transform-origin:top left;
    }
.buttonB{
  margin-right:30px;
  background-color: turquoise;
}
.buttonR{
  margin-right:10px;
  background-color: #ffcccc;
}
.buttonD{
  margin-top:20px;
}
  th, td {
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
  .rootstatus{
    margin-top: 5%;
    margin-left:10%; 
    width:50%;
  }
  .footer {
    position: relative; /* 固定せず、通常フローで配置 */
    bottom: -250px;
  }

  .error{
    color:red;
  }
 .error-popup {
  position: fixed;
  z-index:90;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ffcccc;
  padding: 10px;
  border: 2px solid #ff0000;
 }
 .info-popup {
  position: fixed;
  z-index:10;
  top: 70%;
  left: 30%;
  background-color: #cce5ff;
  padding: 10px;
  border: 1px solid #ff0000;
 }
.comment_author
    {
     font-size:16px;
     width:100%;
     height:40px;
     border-style: solid;
     border-color: black;
     display:inline-flex;
     position:relative;
     color:black;
}  
.comment_input
{
     font-size:16px;
     font-weight: bold;
}
.red_text
{
  color:red;
}
.blinking-bar
{
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
