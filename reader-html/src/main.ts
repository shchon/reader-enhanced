import { createApp } from 'vue'
import './assets/global.css'
import './assets/normalize.css'
import i18 from './i18n'
import router from './router'
import pinia from './store'
import App from './App.vue'
import { db } from './services/db'

window.process = window.process || {}
window.process.cwd = () => '/'

// 初始化本地数据库（Dexie），确保 books / vocabulary 表在应用启动后就可见
db.open().catch((error) => {
  // 这里仅记录错误，实际错误处理和 UI 提示在后续步骤中完善
  console.error('Failed to open local database', error)
})

const app = createApp(App)

app.use(i18)
app.use(router)
app.use(pinia)

app.mount('#app')
