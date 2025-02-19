<script setup>
  const props = defineProps({
    isVisible: {
      type: Boolean,
      required: true,
    },
  });
  const emit = defineEmits(['explClose']);

  function closeModal() {
    emit('close');
  }
</script>
<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <button @click="closeModal" class="close-button">×</button>
      <div class="content">
        <!-- ここに説明用のコンテンツを追加 -->
        <h2>文書署名・却下の操作説明</h2>
        <p>
          (1)文書の内容を確認してください<br />
          　　　当該文書が見れるのは、文書が回送されてから7日間のみです　 　　
        </p>
        <p>
          (2)入力説明　入力の必要がある場合には、下に説明が出力されます<br />
          入力のページ位置、スタイル、入力内容が記載されています<br />
          テキストで入力が必要な場合は、入力できる行数も記載されています。文字の大きさは入力内容により自動調整されます<br />
        </p>
        <p>
          (3)入力方法　それぞれの入力指示に沿って入力してください<br />
          　　・押印画像：対象のファイルを読込、完ボタンを押して下さい。読み込める画像はjpegもしくはpngのみです
          　　・テキスト：入力指示内容に沿って入力してください。改行は自身でおこなってください
          　　　　　　　　入力できる行数は、説明に記載されている行数までです。文字の大きさは入力された文字数で自動調整されます
          <br />
          ・日付　　：カレンダーマークを押し日付を選択してください。直接入力もできます。電子署名時には年・月・日のフォーマット変換して表示されます<br />
          　　・描画　　：マウスでサイン等描画ができます。入力が完了しましたら完ボタンを押してください<br />
        </p>
        　
        <p>
          (4)文書の承認・署名　文書を確認し、（入力ある場合は）入力が完了しましたら、承認・署名するボタンをおしてください<br />
          　　　　　　　　　　　電子署名され、次の回送者に文書が送られます 　
        </p>
        <p>
          (5)文書の却下　文書を確認し、却下の必要がある場合は「発信者へのメッセージ」に理由を記載して
          却下ボタンを押してください<br />
          却下のメールが文書作成者に送られます 　　　　　　　 　 　
        </p>
        <p>(6)ルート確認　ルート確認ボタンを押すと、文書の回送状態がわかります</p>
      </div>
      <div class="video">
        <p>動画説明（13秒）</p>
        <video
          width="340"
          height="180"
          ontrolsList="nodownload"
          src="../../public/guide/image/7_oincloud_pdfSign.mp4"
          controls
        ></video>
      </div>
      <button @click="closeModal" class="close-button-b">×</button>
    </div>
  </div>
</template>

<style scoped>
  .modal-overlay {
    position: fixed;
    top: 0px;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    overflow: scroll;
  }
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 5px;
    position: relative;
  }
  .content {
    font-size: 14px;
  }
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.5rem;
  }
  .close-button-b {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.5rem;
  }
  .video {
    text-align: center;
    margin-bottom: 0px;
  }
</style>
