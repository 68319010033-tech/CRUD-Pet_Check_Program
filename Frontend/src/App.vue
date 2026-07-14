<script setup>
import { ref, computed, onMounted } from 'vue';

// Fallback images pool
const fallbackImages = {
  dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600',
  rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600',
  general: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?auto=format&fit=crop&q=80&w=600'
};

// Pet type categories list
const types = ref([
  { label: 'ทั้งหมด 🌱', value: 'all', icon: '🐾' },
  { label: 'สุนัข 🐶', value: 'dog', icon: '🐕' },
  { label: 'แมว 🐱', value: 'cat', icon: '🐈' },
  { label: 'กระต่าย 🐰', value: 'rabbit', icon: '🐇' }
]);

const showAddTypeForm = ref(false);
const newTypeName = ref('');
const selectedType = ref('all');

const pets = ref([]);
const isLoading = ref(false);
const formSubmitting = ref(false);
const notification = ref(null);

const apiBaseUrl = ref('http://localhost:5000');
const showTerminal = ref(true);
const apiLogs = ref([]);

// Modals states
const showModal = ref(false);
const isEditMode = ref(false);
const form = ref({
  id: null,
  name: '',
  type: '',
  breed: '',
  price: '',
  tags: '',
  image: '',
  available: true
});

// Custom delete confirmation modal state (No confirm() used)
const deleteConfirmModal = ref({
  show: false,
  petId: null,
  petName: ''
});

const addLog = (type, method, endpoint, data = null) => {
  const now = new Date();
  const timeString = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  apiLogs.value.unshift({
    time: timeString,
    type,
    method,
    endpoint,
    data: data ? JSON.stringify(data, null, 2) : null
  });
  if (apiLogs.value.length > 30) {
    apiLogs.value.pop();
  }
};

const clearLogs = () => {
  apiLogs.value = [];
};

const showNotification = (message, type = 'success') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3500);
};

const request = async (method, path, body = null) => {
  const endpoint = `${apiBaseUrl.value.replace(/\/$/, '')}${path}`;

  addLog('request', method, endpoint, body);

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(endpoint, options);
    if (!res.ok) {
      const errorText = await res.text();
      addLog('error', `${res.status} ${res.statusText}`, endpoint, { error: errorText });
      throw new Error(`API returned ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    addLog('response', `${res.status} OK`, endpoint, data);
    return data;
  } catch (err) {
    addLog('error', 'Network Connection Refused', endpoint, { message: err.message });
    throw err;
  }
};

const loadPets = async () => {
  isLoading.value = true;
  try {
    const data = await request('GET', '/api/pets');
    pets.value = data || [];
  } catch (err) {
    showNotification('ไม่สามารถโหลดข้อมูลเด็กๆ ได้: ' + err.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadPets();
});

const openAddModal = () => {
  isEditMode.value = false;
  form.value = {
    id: null,
    name: '',
    type: '',
    breed: '',
    price: '',
    tags: '',
    image: '',
    available: true
  };
  showModal.value = true;
};

const openEditModal = async (pet) => {
  try {
    const latestPetDetail = await request('GET', `/api/pets/${pet.id}`);
    isEditMode.value = true;
    form.value = { ...latestPetDetail };
    showModal.value = true;
  } catch (err) {
    showNotification('ไม่สามารถดึงข้อมูลเด็กๆ ล่าสุดได้: ' + err.message, 'error');
  }
};

const closeModal = () => {
  showModal.value = false;
};

const savePet = async () => {
  if (!form.value.name || !form.value.type || !form.value.breed || form.value.price === '') {
    showNotification('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนด้วยครับ', 'error');
    return;
  }

  const numericPrice = Number(form.value.price);
  if (isNaN(numericPrice)) {
    showNotification('กรุณากรอกราคาเป็นตัวเลขที่ถูกต้อง', 'error');
    return;
  }


  const payload = {
    name: form.value.name.trim(),
    type: form.value.type,
    breed: form.value.breed.trim(),
    price: numericPrice,
    tags: form.value.tags ? form.value.tags.trim() : '',
    image: form.value.image || fallbackImages[form.value.type] || fallbackImages.general,
    available: !!form.value.available // มั่นใจว่าเป็น Boolean แน่นอน
  };

  formSubmitting.value = true;
  try {
    if (isEditMode.value) {
      // สำหรับ PUT ต้องระบุ id บน URL และส่ง id ไปกับ Payload ด้วย
      payload.id = form.value.id; 
      const updated = await request('PUT', `/api/pets/${form.value.id}`, payload);
      pets.value = pets.value.map(p => p.id === form.value.id ? updated : p);
      showNotification(`แก้ไขข้อมูล "${form.value.name}" สำเร็จแล้ว`);
    } else {
      // สำหรับ POST ไม่ต้องส่ง id ไปให้ Backend สร้างเอง
      const created = await request('POST', '/api/pets', payload);
      pets.value.push(created);
      showNotification(`ต้อนรับสมาชิกใหม่ "${form.value.name}" สำเร็จแล้ว!`);
    }
    closeModal();
  } catch (err) {
    showNotification('บันทึกข้อมูลล้มเหลว: ' + err.message, 'error');
  } finally {
    formSubmitting.value = false;
  }
};

const triggerDeletePet = (id, name) => {
  deleteConfirmModal.value = {
    show: true,
    petId: id,
    petName: name
  };
};

const cancelDelete = () => {
  deleteConfirmModal.value = {
    show: false,
    petId: null,
    petName: ''
  };
};

const executeDelete = async () => {
  const { petId, petName } = deleteConfirmModal.value;
  try {
    await request('DELETE', `/api/pets/${petId}`);
    pets.value = pets.value.filter(p => p.id !== petId);
    showNotification(`ลบข้อมูล "${petName}" เรียบร้อยแล้ว`);
  } catch (err) {
    showNotification('ลบข้อมูลไม่สำเร็จ: ' + err.message, 'error');
  } finally {
    cancelDelete();
  }
};

const toggleAvailability = async (pet) => {
  const targetState = !pet.available;
  try {
    const payload = { ...pet, available: targetState };
    const updated = await request('PUT', `/api/pets/${pet.id}`, payload);
    pets.value = pets.value.map(p => p.id === pet.id ? { ...p, available: updated.available } : p);
    showNotification(`อัปเดตสถานะ "${pet.name}" เรียบร้อยแล้ว`);
  } catch (err) {
    showNotification('สลับสถานะล้มเหลว: ' + err.message, 'error');
  }
};

const addNewType = () => {
  if (!newTypeName.value.trim()) return;
  const formattedLabel = newTypeName.value.trim();
  const formattedValue = formattedLabel.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\wก-๙\-]/g, '');

  const exists = types.value.some(t => t.value === formattedValue);
  if (!exists) {
    types.value.push({
      label: `${formattedLabel} ✨`,
      value: formattedValue,
      icon: '✨'
    });
    showNotification(`เพิ่มหมวดหมู่ "${formattedLabel}" เรียบร้อยแล้ว`);
  }
  newTypeName.value = '';
  showAddTypeForm.value = false;
};

const getTypeName = (value) => {
  const found = types.value.find(t => t.value === value);
  return found ? found.label.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim() : value;
};

const parseTags = (tagString) => {
  if (!tagString) return [];
  return tagString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag !== '')
    .slice(0, 3);
};

const formatPrice = (price) => {
  return Number(price).toLocaleString();
};

const filteredPets = computed(() => {
  if (selectedType.value === 'all') return pets.value;
  return pets.value.filter(pet => pet.type === selectedType.value);
});
</script>

<template>
  <div class="min-h-screen pb-24 selection:bg-[#7F9C86] selection:text-white">
    <!-- Navigation Header -->
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

      <div class="flex items-center space-x-3">
        <div class="hidden sm:flex items-center space-x-2 bg-[#F3EDE2]/40 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          <span class="text-[#2A2A2A]/80">{{ apiBaseUrl }}</span>
        </div>
        <button 
          @click="openAddModal" 
          class="bg-[#7F9C86] hover:bg-[#5E7463] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-300 flex items-center space-x-2 transform hover:scale-[1.02]"
        >
          <span>+ ต้อนรับสมาชิกใหม่</span>
        </button>
      </div>
    </nav>

    <!-- Main Container Content -->
    <main class="max-w-7xl mx-auto px-6 md:px-12 mt-10">
      <!-- Decorative Welcoming Hero Panel -->
      <div class="mb-10 bg-[#F3EDE2]/40 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center border border-[#F3EDE2]/30 relative overflow-hidden">
        <div class="z-10 max-w-lg">
          <h1 class="text-3xl font-bold text-[#2A2A2A] mb-2">หาเพื่อนแท้ที่ใจดีที่สุดสำหรับคุณ 🌿</h1>
          <p class="text-[#2A2A2A]/70 text-sm leading-relaxed">แดชบอร์ดจัดการหน้าร้านเชื่อมต่อ API สมบูรณ์แบบ (GET, POST, PUT, DELETE) สไตล์อบอุ่นแบบนอร์ดิก</p>
        </div>
        <div class="mt-4 md:mt-0 z-10 bg-white/80 backdrop-blur px-6 py-3 rounded-2xl border border-[#F3EDE2] flex items-center space-x-4">
          <div class="text-center">
            <span class="block text-2xl font-bold text-[#7F9C86]">{{ pets.length }}</span>
            <span class="text-xs text-[#2A2A2A]/60 font-medium">สมาชิกทั้งหมด</span>
          </div>
          <div class="h-8 w-px bg-[#F3EDE2]"></div>
          <div class="text-center">
            <span class="block text-2xl font-bold text-[#D08C60]">{{ types.length - 1 }}</span>
            <span class="text-xs text-[#2A2A2A]/60 font-medium">ประเภทสัตว์เลี้ยง</span>
          </div>
        </div>
      </div>

      <!-- Dynamic Notification Toast -->
      <transition name="fade">
        <div v-if="notification" class="fixed top-24 right-6 z-50 transform transition-all duration-300 max-w-sm">
          <div :class="notification.type === 'success' ? 'bg-[#7F9C86] text-white' : 'bg-red-500 text-white'" class="px-5 py-4 rounded-2xl shadow-lg flex items-center space-x-3 border border-white/10">
            <span class="text-lg">{{ notification.type === 'success' ? '✅' : '⚠️' }}</span>
            <span class="text-sm font-semibold">{{ notification.message }}</span>
          </div>
        </div>
      </transition>

      <!-- Categories Bar -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F3EDE2] pb-4">
          <div class="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none w-full sm:w-auto">
            <button
              v-for="t in types"
              :key="t.value"
              @click="selectedType = t.value"
              class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap flex items-center space-x-2"
              :class="selectedType === t.value ? 'bg-[#7F9C86] text-white shadow-sm' : 'bg-[#F3EDE2]/40 text-[#2A2A2A]/70 hover:bg-[#F3EDE2]/80'"
            >
              <span class="mr-1">{{ t.icon }}</span>
              <span>{{ t.label }}</span>
            </button>
          </div>

          <div class="flex items-center space-x-2 shrink-0">
            <button 
              @click="showAddTypeForm = !showAddTypeForm" 
              class="text-[#7F9C86] hover:text-[#5E7463] text-sm font-bold flex items-center space-x-1.5 transition-colors"
            >
              <span class="w-7 h-7 rounded-full bg-[#7F9C86]/10 flex items-center justify-center text-xs font-bold">
                {{ showAddTypeForm ? '−' : '＋' }}
              </span>
              <span>{{ showAddTypeForm ? 'ปิดเมนู' : 'เพิ่มประเภทสัตว์เลี้ยง' }}</span>
            </button>
          </div>
        </div>

        <!-- Quick Creator Type Form Panel -->
        <transition name="slide">
          <div v-if="showAddTypeForm" class="mt-4 p-4 bg-white border border-[#F3EDE2]/60 rounded-2xl shadow-sm max-w-md">
            <h3 class="text-sm font-bold text-[#2A2A2A] mb-3 flex items-center space-x-2">
              <span class="text-[#7F9C86]">📂</span>
              <span>สร้างหมวดหมู่สัตว์เลี้ยงใหม่</span>
            </h3>
            <div class="flex space-x-2">
              <input
                type="text"
                v-model="newTypeName"
                placeholder="เช่น นก, แฮมสเตอร์..."
                class="flex-1 px-4 py-2 text-sm bg-[#FAF7F2] rounded-xl border border-[#F3EDE2] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/30 focus:border-[#7F9C86] text-[#2A2A2A] font-medium"
                @keyup.enter="addNewType"
              />
              <button 
                @click="addNewType" 
                class="bg-[#7F9C86] hover:bg-[#5E7463] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-1"
              >
                <span>เพิ่ม</span>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="n in 3" :key="n" class="bg-white rounded-[2rem] border border-[#F3EDE2]/50 overflow-hidden shadow-sm h-[400px] flex flex-col justify-between p-6">
          <div class="animate-pulse bg-gray-200 w-full h-48 rounded-2xl mb-4"></div>
          <div class="animate-pulse bg-gray-200 h-6 w-3/4 rounded-md mb-2"></div>
          <div class="animate-pulse bg-gray-200 h-4 w-1/2 rounded-md mb-4"></div>
          <div class="animate-pulse bg-gray-200 h-8 w-1/3 rounded-full mb-4"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPets.length === 0" class="py-20 text-center bg-white rounded-3xl border border-[#F3EDE2]/50">
        <div class="max-w-sm mx-auto">
          <span class="block text-5xl mb-4">🐾</span>
          <h2 class="text-xl font-bold text-[#2A2A2A] mb-2">ไม่มีข้อมูลเด็กๆ ในหมวดหมู่นี้</h2>
          <p class="text-[#2A2A2A]/60 text-sm mb-6">คุณสามารถเพิ่มสมาชิกคนใหม่เข้าไปทดสอบระบบ API ได้เลยทันที</p>
          <button 
            @click="openAddModal" 
            class="bg-[#7F9C86] hover:bg-[#5E7463] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm"
          >
            + ต้อนรับสัตว์เลี้ยงตัวแรก
          </button>
        </div>
      </div>

      <!-- Pet Cards Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="pet in pets.filter(p => selectedType === 'all' || p.type === selectedType)"
          :key="pet.id"
          class="group bg-white rounded-[2rem] border border-[#F3EDE2]/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col transform hover:-translate-y-1 relative"
        >
          <!-- Pet Image Frame with Custom SVG Hover buttons overlay -->
          <div class="relative h-64 overflow-hidden bg-[#F3EDE2]/30">
            <img
              :src="pet.image"
              :alt="pet.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            <!-- Category Pill Tag -->
            <span class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3.5 py-1.5 rounded-full text-xs font-bold text-[#2A2A2A] shadow-sm">
              {{ getTypeName(pet.type) }}
            </span>

            <!-- Actions Drawer: Hidden by default (opacity-0), Appears beautifully on Hover -->
            <div class="absolute inset-0 bg-[#2A2A2A]/35 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto flex items-center justify-center space-x-6 transition-opacity duration-300">
              
              <!-- Edit Action -->
              <button 
                @click="openEditModal(pet)" 
                class="w-16 h-16 bg-white hover:bg-[#FAF7F2] rounded-full flex flex-col items-center justify-center text-[#7F9C86] hover:text-[#5E7463] shadow-lg transition-all transform hover:scale-110 focus:outline-none"
                title="แก้ไขข้อมูลสัตว์เลี้ยง (Edit)"
              >
                <!-- Pencil Edit Icon -->
                <svg class="w-5 h-5 text-[#7F9C86] mb-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <span class="text-[9px] font-bold text-[#7F9C86] leading-none select-none">แก้ไข</span>
              </button>

              <!-- Delete Action -->
              <button 
                @click="triggerDeletePet(pet.id, pet.name)" 
                class="w-16 h-16 bg-white hover:bg-red-50 rounded-full flex flex-col items-center justify-center text-red-500 hover:text-red-600 shadow-lg transition-all transform hover:scale-110 focus:outline-none"
                title="ลบข้อมูลสัตว์เลี้ยง (Delete)"
              >
                <!-- Trash Bin Icon -->
                <svg class="w-5 h-5 text-red-500 mb-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span class="text-[9px] font-bold text-red-500 leading-none select-none">ลบ</span>
              </button>
            </div>
          </div>

          <!-- Pet Identity Info -->
          <div class="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-[#2A2A2A]">{{ pet.name }}</h3>
                <span class="text-lg font-bold text-[#D08C60]">฿{{ formatPrice(pet.price) }}</span>
              </div>
              
              <p class="text-sm text-[#2A2A2A]/60 mb-4 font-medium flex items-center">
                <span class="mr-1.5 text-xs text-[#7F9C86]/60">🧬</span>
                สายพันธุ์: {{ pet.breed }}
              </p>

              <div class="flex flex-wrap gap-1.5 mb-6">
                <span
                  v-for="(tag, index) in parseTags(pet.tags)"
                  :key="index"
                  class="bg-[#F3EDE2]/60 px-3 py-1 rounded-full text-[11px] font-bold text-[#2A2A2A]/70 uppercase tracking-wider"
                >
                  # {{ tag }}
                </span>
              </div>
            </div>

            <!-- Card Actions Footer -->
            <div class="flex items-center justify-between pt-4 border-t border-[#F3EDE2]/60">
              <div class="flex items-center space-x-2 text-xs font-bold" :class="pet.available ? 'text-[#7F9C86]' : 'text-[#2A2A2A]/40'">
                <span class="w-2 h-2 rounded-full" :class="pet.available ? 'bg-[#7F9C86] animate-pulse' : 'bg-[#2A2A2A]/40'"></span>
                <span>{{ pet.available ? 'พร้อมย้ายบ้าน' : 'มีเจ้าของแล้ว' }}</span>
              </div>
              <button 
                @click="toggleAvailability(pet)" 
                class="text-xs font-bold text-[#2A2A2A]/60 hover:text-[#7F9C86] transition-colors flex items-center space-x-1 focus:outline-none"
              >
                <span class="text-[10px]">🔄</span>
                <span>สลับสถานะ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Slide-Over Drawer Modal (Add / Edit Form) -->
    <transition name="slide-over">
      <div v-if="showModal" class="fixed inset-0 z-50 flex justify-end">
        <div @click="closeModal" class="absolute inset-0 bg-[#2A2A2A]/30 backdrop-blur-sm"></div>
        
        <div class="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-[#F3EDE2]">
          <div>
            <div class="flex justify-between items-center pb-5 border-b border-[#F3EDE2] mb-6">
              <h2 class="text-xl font-bold text-[#2A2A2A] flex items-center space-x-2">
                <span class="w-8 h-8 rounded-full bg-[#7F9C86]/10 flex items-center justify-center text-xs">
                  {{ isEditMode ? '✏️' : '＋' }}
                </span>
                <span>{{ isEditMode ? 'แก้ไขโปรไฟล์เด็กๆ' : 'ลงทะเบียนเด็กๆ คนใหม่' }}</span>
              </h2>
              <button @click="closeModal" class="w-8 h-8 rounded-full hover:bg-[#F3EDE2]/60 flex items-center justify-center text-[#2A2A2A]/60 focus:outline-none">
                <span>✕</span>
              </button>
            </div>

            <form @submit.prevent="savePet" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">ชื่อเด็กๆ *</label>
                <input 
                  type="text" 
                  v-model="form.name" 
                  required 
                  placeholder="เช่น มิลค์กี้, คุกกี้" 
                  class="w-full px-4 py-2.5 bg-white border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">ประเภทของสัตว์เลี้ยง *</label>
                <select 
                  v-model="form.type" 
                  required 
                  class="w-full px-4 py-2.5 bg-white border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
                >
                  <option value="" disabled>เลือกประเภทของน้อง</option>
                  <!-- Exclude 'all' option -->
                  <option v-for="type in types.slice(1)" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">สายพันธุ์ *</label>
                <input 
                  type="text" 
                  v-model="form.breed" 
                  required 
                  placeholder="เช่น ชอร์ตแฮร์, โกลเด้น" 
                  class="w-full px-4 py-2.5 bg-white border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">ราคาค่าตัว (บาท) *</label>
                <input 
                  type="number" 
                  v-model="form.price" 
                  required 
                  min="0" 
                  placeholder="ระบุราคาค่าสินสอด" 
                  class="w-full px-4 py-2.5 bg-white border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#2A2A2A]/70 mb-1.5 uppercase tracking-wider">ลิงก์รูปภาพ (URL)</label>
                <input 
                  type="url" 
                  v-model="form.image" 
                  placeholder="ใส่ลิงก์รูปภาพสุนัข/แมว หรือปล่อยว่างเพื่อใช้รูปเริ่มต้น" 
                  class="w-full px-4 py-2.5 bg-white border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
                />
              </div>

              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-xs font-bold text-[#2A2A2A]/70 uppercase tracking-wider">บุคลิก/นิสัย (คั่นด้วยเครื่องหมายจุลภาค ',')</label>
                  <span class="text-[10px] text-[#2A2A2A]/40 font-bold">สูงสุด 3 แท็ก</span>
                </div>
                <input 
                  type="text" 
                  v-model="form.tags" 
                  placeholder="ขี้อ้อน, อารมณ์ดี, พลังงานสูง" 
                  class="w-full px-4 py-2.5 bg-white border border-[#F3EDE2] rounded-xl text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#7F9C86]/20 focus:border-[#7F9C86] font-medium text-sm"
                />
              </div>

              <div class="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox" 
                  id="available" 
                  v-model="form.available"
                  class="w-4.5 h-4.5 rounded border-[#F3EDE2] text-[#7F9C86] focus:ring-[#7F9C86]"
                />
                <label htmlFor="available" class="text-sm font-semibold text-[#2A2A2A] select-none cursor-pointer">พร้อมสำหรับการย้ายบ้านใหม่ทันที</label>
              </div>
            </form>
          </div>

          <div class="mt-8 pt-4 border-t border-[#F3EDE2] flex space-x-3">
            <button 
              @click="closeModal" 
              class="flex-1 px-4 py-3 bg-[#F3EDE2]/60 hover:bg-[#F3EDE2] text-[#2A2A2A]/80 font-bold text-sm rounded-xl"
            >
              ยกเลิก
            </button>
            <button 
              @click="savePet" 
              :disabled="formSubmitting" 
              class="flex-1 px-4 py-3 bg-[#7F9C86] hover:bg-[#5E7463] disabled:bg-[#7F9C86]/50 text-white font-bold text-sm rounded-xl shadow-sm flex justify-center items-center"
            >
              <span v-if="formSubmitting" class="animate-spin mr-2">⌛</span>
              <span>{{ isEditMode ? 'บันทึกการแก้ไข' : 'ลงทะเบียน' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- CUSTOM MINIMALIST DELETION CONFIRMATION DIALOG (No native confirm() used) -->
    <transition name="fade">
      <div v-if="deleteConfirmModal.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div @click="cancelDelete" class="absolute inset-0 bg-[#2A2A2A]/40 backdrop-blur-sm"></div>
        
        <!-- Dialog Container -->
        <div class="bg-[#FAF7F2] rounded-3xl p-6 max-w-sm w-full border border-[#F3EDE2] shadow-2xl relative z-10 text-center">
          <span class="block text-4xl mb-3">⚠️</span>
          <h3 class="text-lg font-bold text-[#2A2A2A] mb-2">ยืนยันการลบข้อมูล</h3>
          <p class="text-sm text-[#2A2A2A]/70 mb-6">คุณแน่ใจว่าต้องการลบน้อง <strong class="text-[#D08C60]">"{{ deleteConfirmModal.petName }}"</strong> ออกจากการดูแลใช่ไหม?</p>
          
          <div class="flex space-x-3">
            <button 
              @click="cancelDelete" 
              class="flex-1 px-4 py-2.5 bg-[#F3EDE2]/80 hover:bg-[#F3EDE2] text-[#2A2A2A]/80 font-bold text-xs rounded-xl"
            >
              ยกเลิก
            </button>
            <button 
              @click="executeDelete" 
              class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              ยืนยันการลบ
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Floating Live Terminal Logger -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      <transition name="slide">
        <div v-if="showTerminal" class="w-80 md:w-96 bg-[#2A2A2A]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 p-4 text-white font-mono text-xs overflow-hidden flex flex-col h-72">
          <div class="flex justify-between items-center border-b border-white/10 pb-2 mb-2 shrink-0">
            <span class="text-[#7F9C86] font-bold flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#7F9C86] animate-ping"></span>
              LIVE API CONSOLE
            </span>
            <button @click="clearLogs" class="text-white/40 hover:text-white">ล้างล็อก</button>
          </div>
          
          <div class="flex-1 overflow-y-auto space-y-2 pr-1 select-text">
            <div v-for="(log, idx) in apiLogs" :key="idx" class="border-l-2 pl-2" :class="log.type === 'request' ? 'border-amber-400' : log.type === 'response' ? 'border-[#7F9C86]' : 'border-red-400'">
              <div class="text-[10px] text-white/40 flex justify-between">
                <span>{{ log.time }}</span>
                <span :class="log.type === 'request' ? 'text-amber-400' : log.type === 'response' ? 'text-[#7F9C86]' : 'text-red-400'">{{ log.method }}</span>
              </div>
              <div class="font-semibold tracking-wide text-white/90 break-all">{{ log.endpoint }}</div>
              <pre v-if="log.data" class="text-[10px] text-white/60 bg-white/5 p-1 rounded mt-1 overflow-x-auto whitespace-pre-wrap max-h-24">{{ log.data }}</pre>
            </div>
            <div v-if="apiLogs.length === 0" class="text-white/30 text-center py-16">
              ยังไม่มีการเรียกใช้งาน API...
            </div>
          </div>
        </div>
      </transition>

      <div class="flex items-center space-x-2">
        

        <button 
          @click="showTerminal = !showTerminal" 
          class="w-11 h-11 bg-[#2A2A2A] text-white hover:bg-[#2A2A2A]/90 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 focus:outline-none"
        >
          <span class="text-sm">💻</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transition Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.slide-over-enter-active, .slide-over-leave-active {
  transition: transform 0.3s ease;
}
.slide-over-enter-from, .slide-over-leave-to {
  transform: translateX(100%);
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>