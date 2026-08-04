<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { verifyEmail } from '../services/auth';

const route = useRoute();
const router = useRouter();
const message = ref('กำลังยืนยันอีเมล...');
const isError = ref(false);

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    isError.value = true;
    message.value = 'ไม่พบ verification token ในลิงก์';
    return;
  }

  try {
    const data = await verifyEmail(String(token));
    message.value = data.message || 'ยืนยันอีเมลสำเร็จ';
    setTimeout(() => router.push('/login'), 1500);
  } catch (error) {
    isError.value = true;
    message.value = error.message;
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 bg-[#FAF7F2]">
    <div class="bg-white rounded-[2rem] border border-[#F3EDE2] shadow-sm p-8 max-w-md w-full text-center">
      <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-[#7F9C86]/10 flex items-center justify-center text-xl">
        {{ isError ? '⚠️' : '✉️' }}
      </div>
      <h1 class="text-xl font-bold text-[#2A2A2A] mb-2">ยืนยันอีเมล</h1>
      <p class="text-sm" :class="isError ? 'text-red-500' : 'text-[#2A2A2A]/70'">{{ message }}</p>
      <router-link to="/login" class="inline-block mt-6 text-sm font-bold text-[#7F9C86]">ไปหน้าเข้าสู่ระบบ</router-link>
    </div>
  </div>
</template>
