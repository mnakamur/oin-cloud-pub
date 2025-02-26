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
        <h2>入力設定の操作説明</h2>
        <p>
          (1)ドキュメントの右上に入力設定のツールバーが表示されます<br />
          それぞれの必要な属性ボタンを押すと、領域が文書上の左上に現れます
          （入力できる属性はテキスト入力、日付入力、線描画、画像領域の4種類です。）<br />
          各ページごとにツールバーが表示されますので、入力対象ページに行き、そのページのツールバーで操作してください<br />
        </p>
        ・入力位置の調整　　　　　：ドラッグ＆ドロップで入力位置を調整してください<br />
        ・領域の大きさ　　　　　　：領域の下の矢印マークを使って、入力領域の大きさを決定してください<br />
        　*テキスト入力について　　：テキスト入力欄については、領域を入力行数・幅を上下左右矢印を使って合わせてください<br />
        　　　　　　　　　　　　　　画像は押印画像を対象としていますので、形は正方形のみです<br />
        ・入力内容に関する説明：それぞれのボタン領域の下に説明文入力欄がありますので、どんな内容を入力するのか40文字以内で入力してください<br />
        <p>(2)それぞれの入力後、完ボタンを押すと内容が固定されます</p>
        <p>
          (3)全ての入力領域が完了後、署名設定を保存するボタンで確定してください<br />
          自動的にルート設定画面に戻ります
        </p>
      </div>
      <div class="video">
        <p>動画説明（27秒）</p>
        <video
          width="560"
          height="315"
          ontrolsList="nodownload"
          src="../../public/guide/image/5_oincloud_inputDefine.mp4"
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
