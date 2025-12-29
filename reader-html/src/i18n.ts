import { createI18n } from 'vue-i18n'
import enMessage from './locales/en.json'
import zhMessage from './locales/zh.json'

const LOCALE_KEY = 'lingoReader.locale'

function getInitialLocale(): 'en' | 'zh' {
	if (typeof window === 'undefined')
		return 'en'
	try {
		const stored = window.localStorage.getItem(LOCALE_KEY)
		return stored === 'zh' ? 'zh' : 'en'
	}
	catch {
		return 'en'
	}
}

export const i18n = createI18n({
	locale: getInitialLocale(),
	messages: {
		en: enMessage,
		zh: zhMessage,
	},
})

// helper to save locale when changed from components
export function saveLocale(locale: 'en' | 'zh') {
	if (typeof window === 'undefined')
		return
	try {
		window.localStorage.setItem(LOCALE_KEY, locale)
	}
	catch {
		// ignore
	}
}
export default i18n
