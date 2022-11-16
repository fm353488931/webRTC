import { createApp } from "vue"
import router from './router'
import "./style.css"
import App from "./App.vue"

import Antd from "ant-design-vue"
import { message } from "ant-design-vue"
import "ant-design-vue/dist/antd.css"

window.$message = message

createApp(App).use(router).use(Antd).mount("#app")
