<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  login,
  register,
  resendVerification,
  forgotPassword,
} from '../services/auth';

const router = useRouter();
const route = useRoute();

// modes: login | register | forgot | resend
const mode = ref('login');
const isSubmitting = ref(false);
const notification = ref(null);
const verificationLink = ref('');

const form = ref({
  email: '',
  password: '',
  display_name: '',
});

const showNotification = (message, type = 'success') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 6000);
};

const resetForm = () => {
  form.value = {
    email: form.value.email,
    password: '',
    display_name: '',
  };
};

const setMode = (nextMode) => {
  mode.value = nextMode;
  verificationLink.value = '';
  resetForm();
};

const titleMap = {
  login: 'เข้าสู่ระบบ',
  register: 'สมัครสมาชิก',
  forgot: 'ลืมรหัสผ่าน',
  resend: 'ส่งอีเมลยืนยันอีกครั้ง',
};

const subtitleMap = {
  login: 'กรอกข้อมูลบัญชีของคุณเพื่อเข้าใช้งาน',
  register: 'สร้างบัญชีใหม่ — ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ',
  forgot: 'ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ',
  resend: 'ขอลิงก์ยืนยันอีเมลใหม่หากยังไม่ได้ยืนยัน',
};

onMounted(() => {
  const verified = route.query.verified;
  const message = route.query.message;
  if (verified === '1') {
    showNotification(String(message || 'ยืนยันอีเมลสำเร็จ กรุณาเข้าสู่ระบบ'));
  } else if (verified === '0') {
    showNotification(String(message || 'ยืนยันอีเมลไม่สำเร็จ'), 'error');
  }
});

const handleSubmit = async () => {
  if (!form.value.email) {
    showNotification('กรุณากรอกอีเมล', 'error');
    return;
  }

  if ((mode.value === 'login' || mode.value === 'register') && !form.value.password) {
    showNotification('กรุณากรอกรหัสผ่าน', 'error');
    return;
  }

  if (mode.value === 'register' && !form.value.display_name.trim()) {
    showNotification('กรุณากรอกชื่อที่แสดงสำหรับการสมัครสมาชิก', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    if (mode.value === 'register') {
      const data = await register(
        form.value.email.trim(),
        form.value.password,
        form.value.display_name.trim()
      );
      showNotification(data.message || 'สมัครสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
      setMode('login');
      // keep the verification link visible after switching to login (dev/Ethereal only)
      verificationLink.value = data.verification_url || data.frontend_verification_url || '';
      return;
    }

    if (mode.value === 'forgot') {
      const data = await forgotPassword(form.value.email.trim());
      showNotification(data.message || 'หากอีเมลมีในระบบ จะได้รับลิงก์รีเซ็ตรหัสผ่าน');
      setMode('login');
      return;
    }

    if (mode.value === 'resend') {
      const data = await resendVerification(form.value.email.trim());
      verificationLink.value = data.verification_url || data.frontend_verification_url || '';
      showNotification(data.message || 'ส่งอีเมลยืนยันแล้ว (ถ้าบัญชียังไม่ยืนยัน)');
      setMode('login');
      verificationLink.value = data.verification_url || data.frontend_verification_url || '';
      return;
    }

    await login(form.value.email.trim(), form.value.password);
    showNotification('เข้าสู่ระบบสำเร็จ');
    setTimeout(() => {
      router.push('/');
    }, 400);
  } catch (error) {
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      showNotification('บัญชียังไม่ได้ยืนยันอีเมล — กดยืนยันจากลิงก์ หรือส่งอีเมลยืนยันอีกครั้ง', 'error');
      setMode('resend');
      return;
    }
    showNotification(error.message, 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen pb-24 selection:bg-[#7F9C86] selection:text-white">
    <nav class="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#F3EDE2]/60 px-6 py-4 md:px-12 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-[#7F9C86] text-white rounded-full flex items-center justify-center shadow-sm">
          <span class="text-xl">🐾</span>
        </div>
        <div>
          <span class="text-xl font-bold tracking-tight text-[#2A2A2A]">CozyTail</span>
          <p class="text-xs text-[#5E7463]/80 font-medium">Minimalist Pet Haven</p>
        </div>
      </div>

      <div class="hidden sm:flex items-center space-x-2 bg-[#F3EDE2]/40 px-3.5 py-1.5 rounded-full text-xs font-semibold">
        <span class="w-2 h-2 rounded-full bg-[#7F9C86] animate-pulse"></span>
        <span class="text-[#2A2A2A]/80">Secure Login</span>
      </div>
    </nav>

    <transition name="fade">
      <div v-if="notification" class="fixed top-24 right-6 z-50 transform transition-all duration-300 max-w-sm">
        <div
          :class="notification.type === 'success' ? 'bg-[#7F9C86] text-white' : 'bg-red-500 text-white'"
          class="px-5 py-4 rounded-2xl shadow-lg flex items-center space-x-3 border border-white/10"
        >
          <span class="text-lg">{{ notification.type === 'success' ? '✅' : '⚠️' }}</span>
          <span class="text-sm font-semibold">{{ notification.message }}</span>
        </div>
      </div>
    </transition>

    <main class="max-w-7xl mx-auto px-6 md:px-12 mt-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div class="bg-[#F3EDE2]/40 rounded-3xl p-8 md:p-10 border border-[#F3EDE2]/30 relative overflow-hidden flex flex-col justify-center min-h-[520px]">
          <div class="z-10 max-w-md">
            <span class="inline-flex items-center space-x-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-[#7F9C86] mb-5 border border-[#F3EDE2]">
              <span>🔐</span>
              <span>JWT + Email Verify + RBAC</span>
            </span>
            <h1 class="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 leading-tight">
              ยินดีต้อนรับกลับสู่ CozyTail 🌿
            </h1>
            <p class="text-[#2A2A2A]/70 text-sm leading-relaxed mb-8">
              ระบบยืนยันอีเมล กู้คืนรหัสผ่าน ป้องกัน brute-force และสิทธิ์ผู้ดูแลระบบ ตามใบงานอัปเกรด Authentication
            </p>

            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white/80 backdrop-blur px-5 py-4 rounded-2xl border border-[#F3EDE2]">
                <span class="block text-2xl font-bold text-[#7F9C86]">JWT</span>
                <span class="text-xs text-[#2A2A2A]/60 font-medium">Access Token</span>
              </div>
              <div class="bg-white/80 backdrop-blur px-5 py-4 rounded-2xl border border-[#F3EDE2]">
                <span class="block text-2xl font-bold text-[#D08C60]">Safe</span>
                <span class="text-xs text-[#2A2A2A]/60 font-medium">bcrypt Password</span>
              </div>
            </div>
          </div>

          <div class="absolute -right-8 -bottom-8 w-48 h-48 bg-[#7F9C86]/10 rounded-full blur-2xl"></div>
          <div class="absolute top-8 right-8 text-6xl opacity-20 select-none">🐶</div>
        </div>

        <div class="bg-white rounded-[2rem] border border-[#F3EDE2]/50 shadow-sm p-8 md:p-10 flex flex-col justify-center min-h-[520px]">
          <div class="mb-8">
            <div class="flex items-center space-x-2 mb-3">
              <span class="w-8 h-8 rounded-full bg-[#7F9C86]/10 flex items-center justify-center text-sm">
                {{ mode === 'register' ? '✨' : mode === 'forgot' ? '📧' : '🔑' }}
              </span>
              <h2 class="text-2xl font-bold text-[#2A2A2A]">{{ titleMap[mode] }}</h2>
            </div>
            <p class="text-sm text-[#2A2A2A]/60">{{ subtitleMap[mode] }}</p>
          </div>

          <div
            v-if="verificationLink"
            class="mb-6 p-4 rounded-2xl bg-[#7F9C86]/10 border border-[#7F9C86]/20"
          >
            <p class="text-xs font-bold text-[#5E7463] mb-2 uppercase tracking-wider">ลิงก์ยืนยันอีเมล (dev)</p>
            <a
              :href="verificationLink"
              target="_blank"
              rel="noopener"
              class="text-sm font-semibold text-[#7F9C86] underline break-all"
            >
              {{ verificationLink }}
            </a>
            <p class="text-xs text-[#2A2A2A]/50 mt-2">กดลิงก์นี้เพื่อยืนยัน แล้วค่อยเข้าสู่ระบบ</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div v-if="mode === 'register'">
              <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">ชื่อที่แสดง *</label>
              <input
                v-model="form.display_name"
                type="text"
                placeholder="เช่น Bew, Cozy Admin"
                class="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">อีเมล *</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="you@example.com"
                class="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
              />
            </div>

            <div v-if="mode === 'login' || mode === 'register'">
              <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">รหัสผ่าน *</label>
              <input
                v-model="form.password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
              />
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full mt-2 px-4 py-3 bg-[#7F9C86] hover:bg-[#5E7463] disabled:bg-[#7F9C86]/50 text-white font-bold text-sm rounded-xl shadow-sm transition-all duration-300 flex justify-center items-center transform hover:scale-[1.01]"
            >
              <span v-if="isSubmitting" class="animate-spin mr-2">⌛</span>
              <span>{{ titleMap[mode] }}</span>
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-[#F3EDE2]/60 space-y-2 text-center">
            <button
              v-if="mode === 'login'"
              type="button"
              @click="setMode('register')"
              class="block w-full text-sm font-bold text-[#7F9C86] hover:text-[#5E7463] transition-colors"
            >
              ยังไม่มีบัญชี? สมัครสมาชิก
            </button>
            <button
              v-if="mode === 'login'"
              type="button"
              @click="setMode('forgot')"
              class="block w-full text-sm font-semibold text-[#2A2A2A]/60 hover:text-[#7F9C86] transition-colors"
            >
              ลืมรหัสผ่าน?
            </button>
            <button
              v-if="mode === 'login'"
              type="button"
              @click="setMode('resend')"
              class="block w-full text-sm font-semibold text-[#2A2A2A]/60 hover:text-[#7F9C86] transition-colors"
            >
              ส่งอีเมลยืนยันอีกครั้ง
            </button>
            <button
              v-if="mode !== 'login'"
              type="button"
              @click="setMode('login')"
              class="block w-full text-sm font-bold text-[#7F9C86] hover:text-[#5E7463] transition-colors"
            >
              กลับไปเข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
