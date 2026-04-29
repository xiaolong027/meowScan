<template>
  <div id="app-container">
    <Scan
      v-if="currentPage === 'scan'" 
      @done="handleOCRComplete" 
    />
    
    <Result
      v-if="currentPage === 'result'" 
      :text="ocrResult" 
      @retake="currentPage = 'scan'" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Scan from './components/Scan.vue';
import Result from './components/Result.vue';

// 定义当前页面状态：'scan' 或 'result'
const currentPage = ref('scan');
const ocrResult = ref('');

// 当 ScanView 发出 'done' 事件时，保存数据并切页
const handleOCRComplete = (text) => {
  ocrResult.value = text;
  currentPage.value = 'result'; // 这里就是你要的“跳转”
};
</script>
