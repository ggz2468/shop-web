import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入 Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
// 引入 Bootstrap Bundle JS (包含 Popper)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// 引入 Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUser, faHouse, faSearch } from '@fortawesome/free-solid-svg-icons'

// 引入共用 CSS, JS
import '@/assets/css/common.css'
import '@/assets/js/common.js'

// 將圖示加入圖示庫
library.add(faUser, faHouse, faSearch)

// 引入共用組件
import TheNavbar from '@/components/layout/TheNavbar.vue'

const app = createApp(App)

app.use(router)

app.component('font-awesome-icon', FontAwesomeIcon)
app.component('TheNavbar', TheNavbar)

app.mount('#app')
