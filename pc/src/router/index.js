import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/Home.vue') },
  { path: '/apply', component: () => import('../views/Apply.vue') },
  { path: '/user', component: () => import('../views/User.vue') },
  { path: '/admin/login', component: () => import('../views/admin/Login.vue') },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/admin/Dashboard.vue') },
      { path: 'applications', component: () => import('../views/admin/Applications.vue') },
      { path: 'second-interview', component: () => import('../views/admin/SecondInterview.vue') },
      { path: 'admissions', component: () => import('../views/admin/Admissions.vue') },
      { path: 'notifications', component: () => import('../views/admin/Notifications.vue') },
      { path: 'settings', component: () => import('../views/admin/Settings.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    if (!localStorage.getItem('adminToken')) return '/admin/login'
  }
})

export default router
