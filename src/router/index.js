import Vue from 'vue'
import VueRouter from 'vue-router'
//
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Chat from '../views/Chat.vue'
import About from '../views/About.vue'

Vue.use(VueRouter)

const routes = [
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/chat', component: Chat, meta: { requiresAuth: true } },
    { path: '/about', component: About },
    { path: '*', redirect: '/login' }
]

const router = new VueRouter({
    mode: 'history',
    routes
})

router.beforeEach((to, from, next) => {
    console.log("ces ",localStorage.getItem('token'));
    const isLoggedIn = !!localStorage.getItem('token') // 假设登录成功后保存了 token
    if (to.matched.some(record => record.meta.requiresAuth) && !isLoggedIn) {
        next('/login')
    } else {
        next()
    }
})

export default router
