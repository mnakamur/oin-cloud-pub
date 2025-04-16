//import './assets/demo.css'

import { createApp } from "vue";
import App from "./App.vue";
//amplify add
import { Amplify } from "aws-amplify";
import amplifyconfig from "./amplifyconfiguration.json";
//import config from './aws-exports';
import { I18n } from "aws-amplify/utils";
import { translations } from "@aws-amplify/ui-vue";
import i18n from "./i18n";
//Amplify.configure(config);
Amplify.configure({
	...amplifyconfig,
	Auth: {
		mandatorySignIn: true,
		signUpAttributes: ["username"],
		usernameAttribute: ["email"], // ← 追加する
	},
});
import router from "./router.js";
I18n.putVocabularies(translations);
//I18n.setLanguage(locale);
I18n.putVocabularies({
	ja: {
		"Enter your Username": "メールアドレスを入力 ",
		Username: "メールアドレス ",
		Password: "パスワード（8文字以上　大小英文字、数字、記号) ",
		"Attributes did not conform to the schema: email: The attribute is required":
			"メールアドレスがすでに登録されています",
		"Password must have at least 8 characters":
			"パスワードは少なくとも8文字以上必要です",
		"Your passwords must match": "同じパスワードになっていません",
		"Incorrect username or password.":
			"メールアドレスかパスワードが正しくありません",
		"User does not exist.":
			"このメールアドレス・パスワードは登録されていません",
		"Username/client id combination not found.":
			"このメールアドレスは登録されていません",
		"Attributes did not conform to the schema: emails: The attribute emails is required":
			"画面を再度リロードして入力してみてください",
		"Invalid email address format.": "正しいメールアドレスをいれてください",
		"Invalid verification code provided, please try again.":
			"正しい認証コードをいれてください",
	},
	en: {
		Username: "e-mail",
	},
});

const app = createApp(App);
app.use(router);
app.use(i18n);
app.mount("#app");
