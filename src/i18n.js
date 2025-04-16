import { createI18n } from "vue-i18n";
//import ja from './locales/ja';
import en from "./locales/en";

const userLang = navigator.language.slice(0, 2);
const locale = ["ja", "en"].includes(userLang) ? userLang : "en";

const i18n = createI18n({
	legacy: false, // Composition API 用
	locale: locale,
	fallbackLocale: "ja",
	warnHtmlInMessage: "off",
	missingWarn: false,
	fallbackWarn: false,
	messages: {
		//	ja,
		en,
	},
});

export default i18n;
