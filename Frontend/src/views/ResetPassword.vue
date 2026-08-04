<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resetPassword } from '../services/auth';

const route = useRoute();
const router = useRouter();

const token = ref('');
const newPassword = ref('');
const isSubmitting = ref(false);
const message = ref('');
const isError = ref(false);

onMounted(() => {
  token.value = String(route.query.token || '');
  if (!token.value) {
    isError.value = true;
    message.value = 'ไม่พบ reset token ในลิงก์';
  }
});

const handleSubmit = async () => {
  if (!token.value || !newPassword.value) {
    isError.value = true;
    message.value = 'กรุณากรอกรหัสผ่านใหม่';
    return;
  }

  isSubmitting.value = true;
  try {
    const data = await resetPassword(token.value, newPassword.value);
    isError.value = false;
    message.value = data.message || 'ตั้งรหัสผ่านใหม่สำเร็จ';
    setTimeout(() => router.push('/login'), 1200);
  } catch (error) {
    isError.value = true;
    message.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 bg-[#FAF7F2]">
    <div class="bg-white rounded-[2rem] border border-[#F3EDE2] shadow-sm p-8 max-w-md w-full">
      <h1 class="text-xl font-bold text-[#2A2A2A] mb-2 text-center">ตั้งรหัสผ่านใหม่</h1>
      <p class="text-sm text-[#2A2A2A]/60 mb-6 text-center">ใช้ token จากอีเมลเพื่อตั้งรหัสผ่านใหม่</p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">รหัสผ่านใหม่ *</label>
          <input
            v-model="newPassword"
            type="password"
            minlength="6"
            required
            class="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#F3EDE2] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86]"
            placeholder="อย่างน้อย 6 ตัวอักษร"
          />
        </div>
        <button
          type="submit"
          :disabled="isSubmitting || !token"
          class="w-full px-4 py-3 bg-[#7F9C86] hover:bg-[#5E7463] disabled:bg-[#7F9C86]/50 text-white font-bold text-sm rounded-xl"
        >
          {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่' }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-center" :class="isError ? 'text-red-500' : 'text-[#7F9C86]'">
        {{ message }}
      </p>
      <router-link to="/login" class="block mt-4 text-center text-sm font-bold text-[#7F9C86]">กลับไปเข้าสู่ระบบ</router-link>
    </div>
  </div>
</template>
