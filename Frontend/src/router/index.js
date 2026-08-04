import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../services/auth';
import Login from '../views/Login.vue';
import VerifyEmail from '../views/VerifyEmail.vue';
import ResetPassword from '../views/ResetPassword.vue';
import PetDashboard from '../views/PetDashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { guestOnly: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmail,
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPassword,
      meta: { guestOnly: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: PetDashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login' };
  }

  if (to.meta.guestOnly && isAuthenticated() && to.name === 'login') {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
