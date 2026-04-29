<template>
  <div class="flex flex-col min-h-screen bg-[#fcfafc]">
    <header class="bg-[#FFF9FA] px-6 py-4 fixed top-0 w-full z-40 rounded-b-[32px] border-b border-[#F8C8DC]/20 shadow-[0_4px_20px_rgba(248,200,220,0.3)] flex justify-between items-center">
      <span class="material-symbols-outlined text-[#F8C8DC] text-2xl">pets</span>
      <h1 class="text-[#F8C8DC] font-black text-xl flex-1 text-center">小猫扫描仪</h1>
    </header>

    <main class="flex-1 mt-[88px] mb-[110px] px-5 flex flex-col items-center gap-8 max-w-md mx-auto w-full">
      <div class="w-full min-h-[320px] bg-white border-[3px] border-dashed border-primary-container rounded-xl p-4 relative overflow-hidden shadow-[inset_0_4px_20px_rgba(248,200,220,0.15)]">
        <div class="grid grid-cols-2 gap-4">
          <div v-for="img in imageItems" :key="img.id" class="relative aspect-square rounded-xl overflow-hidden border border-primary-container/30">
            <img :src="img.url" class="w-full h-full object-cover" />
            <button @click="removeImage(img.id)" class="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-error shadow-sm">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <button @click="triggerFile" class="aspect-square rounded-xl border-2 border-dashed border-primary-container/60 bg-surface flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-primary text-3xl">add_photo_alternate</span>
            <span class="text-xs text-primary font-bold">Add More</span>
          </button>
        </div>
      </div>

      <div v-if="isScanning" class="w-full px-2">
        <div class="flex justify-between mb-1 text-primary font-bold text-sm">
          <span>Extracting text...</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="h-4 w-full bg-surface-variant rounded-full relative overflow-visible">
          <div class="h-full bg-primary-container rounded-full transition-all duration-300 shadow-md" :style="{ width: progress + '%' }">
            <div class="absolute right-0 -translate-x-[-12px] -top-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[12px] text-primary">pets</span>
            </div>
          </div>
        </div>
      </div>

      <button @click="startOCR" :disabled="imageItems.length === 0 || isScanning" class="w-full bg-primary-container text-on-primary-container rounded-full h-14 flex items-center justify-center gap-3 font-bold shadow-lg active:scale-95 transition-all">
        <span class="material-symbols-outlined">document_scanner</span>
        Start OCR ({{ imageItems.length }} Images)
      </button>
    </main>

    <nav class="fixed bottom-0 w-full flex justify-center pb-8 pointer-events-none">
      <button @click="triggerFile" class="pointer-events-auto group active:scale-90 transition-transform">
        <div class="bg-white rounded-full p-6 shadow-xl border-4 border-primary-container/40">
          <span class="material-symbols-outlined text-5xl text-primary">photo_camera</span>
        </div>
      </button>
    </nav>

    <input type="file" ref="fileInput" multiple accept="image/*" class="hidden" @change="onFileChange" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { performOCR } from '../scanner';

const emit = defineEmits(['done']);
const fileInput = ref(null);
const imageItems = ref([]);
const isScanning = ref(false);
const progress = ref(0);

const triggerFile = () => fileInput.value.click();

const onFileChange = (e) => {
  const files = Array.from(e.target.files);
  if (files.length == 0) {
    e.target.value = '';
    return;
  }
  
  const newItems = files.map(file => ({
    id: `${file.name}-${Date.now()}-${Math.random()}`, // 生成唯一Key
    file: file,
    url: URL.createObjectURL(file)
  }));

  // 只维护一个统一的列表，减少同步负担
  imageItems.value.push(...newItems);
  console.log("onFileChange ", imageItems.value);
  e.target.value = '';
};

const removeImage = (targetId) => {
  const index = imageItems.value.findIndex(item => item.id === targetId);
  if (index !== -1) {
    // 释放内存：这是 Web 应用高性能处理图片的必备步骤
    URL.revokeObjectURL(imageItems.value[index].url);
    // 从列表中移除
    imageItems.value.splice(index, 1);
  }
  console.log("removeImage ", imageItems.value)
};

const startOCR = async () => {
  if (isScanning.value) return; // 防抖
  isScanning.value = true;
  progress.value = 0; // 重置进度条

  try {
    // 建议传入 URL 而不是 File 对象，有时 Wasm 处理 Blob URL 更稳定
    const imageList = imageItems.value.map(item => item.url); 
    const result = await performOCR(imageList, (p) => progress.value = p);
    emit('done', result);
  } catch (err) {
    console.error(err);
    alert("OCR 失败，可能是语言包下载中断，请检查网络后重试");
  } finally {
    isScanning.value = false;
  }
};
</script>