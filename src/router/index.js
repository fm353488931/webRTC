import { createRouter, createWebHashHistory } from "vue-router"

const routes = [
  {
    path: "/",
    redirect: "/userMedia",
  },
  {
    path: "/userMedia",
    name: "userMedia",
    component: () => import("../views/UserMedia.vue"),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
