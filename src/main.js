import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueAwesomePaginate from 'vue-awesome-paginate'
import '@/plugins/axios'

// 引入 Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
// 引入 Bootstrap Bundle JS (包含 Popper)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// 引入 vue-awesome-paginate CSS
import 'vue-awesome-paginate/dist/style.css'

// 引入 Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUser, faHouse, faSearch } from '@fortawesome/free-solid-svg-icons'

// 引入共用 CSS, JS
import '@/assets/css/common.css'

// 引入共用組件
import TheNavbar from '@/components/layout/TheNavbar.vue'

// 將圖示加入圖示庫
library.add(faUser, faHouse, faSearch)

const app = createApp(App)

// 引入需使用的套件
app.use(router)
app.use(VueAwesomePaginate)

app.component('font-awesome-icon', FontAwesomeIcon)
app.component('TheNavbar', TheNavbar)

app.mount('#app')
