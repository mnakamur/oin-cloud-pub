import { ref } from 'vue';

export function useMsgHandler() {
  const errorVisible = ref(false);
  const infoVisible = ref(false);
  const infoMessage = ref('');

  function showMessage(message, type = 'error', timeout = 3000) {
    infoMessage.value = message;
    if (type == 'error') {
      errorVisible.value = true;
    }
    infoVisible.value = true;
    setTimeout(() => {
      infoVisible.value = false;
      errorVisible.value = false;
    }, timeout);
  }

  return {
    errorVisible,
    infoVisible,
    infoMessage,
    showMessage,
  };
}

export function ggID() {
  let id = 0;
  return function genId() {
    return id++;
  };
}
export function timeout(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
export const noop = () => {};

export function generateId() {
  let id = Math.log2(Date.now()) + Math.random();
  return id.toString().replace('.', '');
}
export function convertForDisplay(int_code) {
  const convertMap = {
    signonly: '署名のみ',
    signinput: '署名入力あり',
    verifier: '検証のみ',
    // shomeistatus,bunstatus
    create: '作成中',
    save: '作成済',
    send: '送信済',
    signed: '署名済',
    reject: '却下済',
    complete: '署名完',
    sendError: '送信エラー',
  };
  if (int_code.includes(',')) {
    const signedStatus = int_code.split(',');
    return parseInt(signedStatus[1]) + 1 + '人目' + convertMap[signedStatus[0]];
  } else {
    return convertMap[int_code] || int_code;
  }
}
export function formatToJST(dateString) {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tokyo',
  };
  return date.toLocaleString('ja-JP', options);
}
//scroll utils
export function onLastPage() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth',
  });
}

export function onFirstPage() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}
export function onPageChange(onPage, pHeight) {
  const scroll = (pHeight + 32) * onPage;
  window.scrollTo({
    top: scroll,
    behavior: 'smooth',
  });
}

export function getSignatureFromUrl(url) {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  return params.get('X-Amz-Signature');
}
