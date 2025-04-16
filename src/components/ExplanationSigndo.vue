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
			<button @click="closeModal" class="close-button">Close</button>
			<div class="content">
				<!-- ここに説明用のコンテンツを追加 -->
				<h2>{{$t('文書署名・却下の操作説明')}}</h2>
				<p>
					(1){{$t('文書の内容を確認してください')}}<br />
					{{$t('当該文書が見れるのは、文書が回送されてから7日間です。')}}　 　　
				</p>
				<p>
					(2){{$t('入力説明')}}
					　{{$t('入力の必要がある場合には、説明が出力されます')}}<br />
					{{$t('入力のページ位置、スタイル、入力内容が記載されています')}}<br />
					{{$t('テキストで入力が必要な場合は、入力できる行数も記載されています。文字の大きさは入力内容により自動調整されます')




					}}<br />
				</p>
				<p>
					(3){{$t('入力方法')}}
					　{{$t('それぞれの入力指示に沿って入力してください')}}<br />
					・{{$t('押印画像')}}
					：{{$t('対象のファイルを読込、完ボタンを押して下さい。読み込める画像はjpeg,jpg,pngです')




					}}<br />
					・{{$t('テキスト')}}
					：{{$t('入力指示内容に沿って入力してください。改行は自身でおこなってください')




					}}<br />{{$t('入力できる行数は、説明に記載されている行数までです。文字の大きさは入力された文字数で自動調整されます')




					}}<br />
					・{{$t('日付')

					}}：{{$t('カレンダーマークを押し、選択してください。直接入力もできます。電子署名時には年・月・日のフォーマット変換されます')




					}}<br />
					・{{$t('描画')

					}}：{{$t('マウスでサイン等描画ができます。入力が完了しましたら完ボタンを押してください')




					}}<br />
				</p>
				　
				<p>
					(4){{$t('文書の承認・署名')}}
					　{{$t('文書を確認し、（入力ある場合は）入力が完了しましたら、承認・署名するボタンをおしてください')




					}}<br />
					{{$t('電子署名され、次の回送者に文書が送られます')}} 　
				</p>
				<p>
					(5){{$t('文書の却下')}}
					　{{$t('文書を確認し、却下の必要がある場合は「発信者へのメッセージ」に理由を記載して却下ボタンを押してください')




					}}<br />
					{{$t('却下のメールが文書作成者に送られます')}} 　　　　　　　 　 　
				</p>
				<p>
					(6){{$t('ルート確認')}}
					　{{$t('ルート確認ボタンを押すと、文書の回送状態がわかります')}}
				</p>
			</div>
			<div class="video">
				<p>{{$t('動画説明')}}（13{{$t('秒')}}）</p>
				<video
					width="560"
					height="315"
					ontrolsList="nodownload"
					src="/guide/image/7_oincloud_pdfSign.mp4"
					controls
				></video>
			</div>
			<button @click="closeModal" class="close-button-b">Close</button>
		</div>
	</div>
</template>

<style scoped>
	.modal-overlay {
	  position: fixed;
	  top: 0px;
	  left: 0;
	  width: 98%;
	  height: 98%;
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
	  margin-top: 300px;
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
