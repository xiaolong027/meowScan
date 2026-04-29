<template>
  <div class="flex flex-col min-h-screen bg-[#fcfafc] selection:bg-primary-container selection:text-on-primary-container">
    <header class="bg-[#FFF9FA] text-[#F8C8DC] font-bold docked full-width top-0 rounded-b-[32px] border-b border-[#F8C8DC]/20 shadow-[0_4px_20px_rgba(248,200,220,0.3)] flex justify-between items-center w-full px-6 py-4 z-50 sticky">
      <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F8C8DC]/10 transition-colors active:scale-95">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">pets</span>
      </button>
      <h1 class="text-[#F8C8DC] font-black text-xl tracking-tight">小猫扫描仪</h1>
      <div class="w-10"></div> </header>

    <main class="flex-1 flex flex-col px-5 py-4 gap-6 overflow-y-auto w-full max-w-md mx-auto">
      <div class="flex items-center justify-center gap-2 text-on-surface-variant text-sm font-semibold">
        <span class="material-symbols-outlined text-primary-container" style="font-variation-settings: 'FILL' 1;">check_circle</span>
        <span>扫描成功！文字已提取。</span>
      </div>

      <div class="relative flex-1 flex flex-col bg-white border border-[#d2c3c7]/30 rounded-xl shadow-[0_8px_30px_rgba(248,200,220,0.15)] overflow-hidden min-h-[250px]">
        <span class="material-symbols-outlined absolute top-[-10px] right-[-10px] text-[120px] text-primary-container/10 rotate-12 pointer-events-none select-none" style="font-variation-settings: 'FILL' 1;">pets</span>
        
        <div class="bg-[#e0f0fd]/40 px-4 py-2 border-b border-[#d2c3c7]/20 flex justify-between items-center relative z-10 backdrop-blur-sm">
          <span class="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
            <span class="material-symbols-outlined text-[16px]">edit_note</span>
            编辑结果
          </span>
          <button @click="copyText" class="text-primary text-xs font-bold px-2 py-1 rounded-md hover:bg-primary-container/30 active:scale-95 transition-all flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">content_copy</span> {{ copyStatus }}
          </button>
        </div>

        <textarea 
          v-model="editableText"
          class="flex-1 w-full p-4 bg-transparent text-[#0e1d26] text-base focus:outline-none focus:ring-2 focus:ring-primary-container resize-none z-10 relative leading-relaxed placeholder:text-gray-400"
          placeholder="提取的文字将显示在这里..."
        ></textarea>
      </div>

      <div class="flex flex-col gap-2">
        <h2 class="text-sm font-bold text-on-surface flex items-center gap-1 ml-1">
          <span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings: 'FILL' 1;">file_present</span>
          导出格式
        </h2>
        <div class="grid grid-cols-4 gap-2">
          <button 
            v-for="format in formats" 
            :key="format"
            @click="selectedFormat = format"
            :class="[
              'relative rounded-lg py-3 flex flex-col items-center justify-center gap-1 transition-all active:scale-95',
              selectedFormat === format ? 'bg-primary-container text-on-primary-container border border-primary-container shadow-md' : 'bg-[#e0f0fd] text-gray-500 border border-transparent'
            ]"
          >
            <span v-if="selectedFormat === format" class="material-symbols-outlined absolute -top-1 -right-1 text-[14px] text-primary" style="font-variation-settings: 'FILL' 1;">pets</span>
            <span class="material-symbols-outlined text-[24px]">{{ getIconForFormat(format) }}</span>
            <span class="text-[10px] font-bold tracking-wider">{{ format }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-3 mt-auto pb-6">
        <button @click="handleExport" class="w-full h-12 bg-[#795465] text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-lg active:translate-y-1 transition-all">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">ios_share</span>
          导出文档
        </button>
        
        <button @click="handleShare" class="w-full h-12 bg-transparent border-2 border-[#795465]/30 text-[#795465] rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#795465]/5">
          <span class="material-symbols-outlined">share</span>
          分享到外部
        </button>

        <button @click="$emit('retake')" class="w-full h-12 bg-[#d5e5f1] text-[#4f4448] rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
          <span class="material-symbols-outlined">refresh</span>
          重新拍摄
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { exportFile } from '../scanner';

const props = defineProps({
  text: String
});

const emit = defineEmits(['retake']);

const editableText = ref(props.text);
const selectedFormat = ref('TXT');
const copyStatus = ref('复制');
const formats = ['TXT', 'DOCX', 'XLSX', 'PDF'];
const isExporting = ref(false);

// 监听内容变化
watch(() => props.text, (newVal) => {
  editableText.value = newVal;
});

const getIconForFormat = (fmt) => {
  const icons = {
    'TXT': 'description',
    'DOCX': 'article',
    'XLSX': 'table',
    'PDF': 'picture_as_pdf'
  };
  return icons[fmt];
};

const copyText = async () => {
  try {
    await navigator.clipboard.writeText(editableText.value);
    copyStatus.value = '已复制!';
    setTimeout(() => copyStatus.value = '复制', 2000);
  } catch (err) {
    console.error('无法复制内容', err);
  }
};

const handleExport = async () => {
  if (isExporting.value) return;
  
  try {
    isExporting.value = true;
    // 假设你的响应式变量名为 editableText 和 selectedFormat
    await exportFile(editableText.value, selectedFormat.value);
  } finally {
    isExporting.value = false;
  }
};

const handleShare = async () => {
  // 分享功能已集成在 exportFile 的 navigator.share 中
  // 这里可以直接复用逻辑
  handleExport();
};
</script>

<style scoped>
/* 针对手机端进行优化 */
textarea {
  font-size: 16px; /* 防止 iOS 自动放大 */
  appearance: none;
  border-radius: 0;
}
</style>