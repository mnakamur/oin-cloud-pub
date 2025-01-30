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
          (1)それぞれの必要な属性ボタンを押すと、領域が文書上の左上に現れます
          （入力できる属性は画像領域、テキスト入力、日付入力、線描画の4種類です。）
        </p>
        ・入力位置の調整　　　　　：ドラッグ＆ドロップで入力位置を調整してください<br />
        ・領域の大きさ　　　　　　：矢印マークを使って、入力領域の大きさを決定してください<br />
        　　　　　　　　　　　　　　テキスト入力欄については、枠内をブランク等で拡張して大きさを決めてください<br />
        ・入力内容に関するコメント：それぞれのボタン領域の下にコメント入力欄がありますので、どんな内容を入力するのか40文字以内で入力してください<br />
        <p>(2)それぞれの入力後、完ボタンを押すと内容が固定されます</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
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
</style>
