<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login, register } from '../services/auth';

const router = useRouter();

const isRegisterMode = ref(false);
const isSubmitting = ref(false);
const notification = ref(null);

const form = ref({
  email: '',
  password: '',
  display_name: '',
});

const showNotification = (message, type = 'success') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3500);
};

const resetForm = () => {
  form.value = {
    email: '',
    password: '',
    display_name: '',
  };
};

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  resetForm();
};

const handleSubmit = async () => {
  if (!form.value.email || !form.value.password) {
    showNotification('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน', 'error');
    return;
  }

  if (isRegisterMode.value && !form.value.display_name.trim()) {
    showNotification('กรุณากรอกชื่อที่แสดงสำหรับการสมัครสมาชิก', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    if (isRegisterMode.value) {
      await register(
        form.value.email.trim(),
        form.value.password,
        form.value.display_name.trim()
      );
      showNotification('สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ CozyTail!');
    } else {
      await login(form.value.email.trim(), form.value.password);
      showNotification('เข้าสู่ระบบสำเร็จ');
    }

    setTimeout(() => {
      router.push('/');
    }, 500);
  } catch (error) {
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
              <span>JWT Authentication</span>
            </span>
            <h1 class="text-3xl md:text-4xl font-bold text-[#2A2A2A] mb-4 leading-tight">
              ยินดีต้อนรับกลับสู่ CozyTail 🌿
            </h1>
            <p class="text-[#2A2A2A]/70 text-sm leading-relaxed mb-8">
              เข้าสู่ระบบเพื่อจัดการข้อมูลสัตว์เลี้ยงของคุณอย่างปลอดภัยด้วย JWT access token และ refresh token ตามมาตรฐานใบงาน
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
                {{ isRegisterMode ? '✨' : '🔑' }}
              </span>
              <h2 class="text-2xl font-bold text-[#2A2A2A]">
                {{ isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ' }}
              </h2>
            </div>
            <p class="text-sm text-[#2A2A2A]/60">
              {{ isRegisterMode ? 'สร้างบัญชีใหม่เพื่อเริ่มใช้งานแดชบอร์ด' : 'กรอกข้อมูลบัญชีของคุณเพื่อเข้าใช้งาน' }}
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div v-if="isRegisterMode">
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

            <div>
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
              <span>{{ isRegisterMode ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ' }}</span>
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-[#F3EDE2]/60 text-center">
            <button
              type="button"
              @click="toggleMode"
              class="text-sm font-bold text-[#7F9C86] hover:text-[#5E7463] transition-colors"
            >
              {{ isRegisterMode ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก' }}
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
