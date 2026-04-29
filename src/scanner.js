import { createWorker } from 'tesseract.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const performOCR = async (images, onProgress) => {
  // 彻底移除那个 1！让引擎自己决定最合适的模式
  // 在 v5 中，第一个参数是语言，第二个参数是“加载级别”，第三个是配置
  const worker = await createWorker('chi_sim+eng', 1, { // 这里的 0 代表默认加载级别
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
    tessedit_ocr_engine_mode: 1, // 强制使用纯 LSTM 模式
    language_model_ngram_on: '0',
});

  try {
    let combinedText = "";
    for (const img of images) {
      const { data: { text } } = await worker.recognize(img);
      combinedText += text + "\n\n";
    }
    return combinedText;
  } finally {
    await worker.terminate();
  }
};

/**
 * 导出文件核心函数
 * @param {string} text 识别出的文本
 * @param {string} format 格式: 'TXT' | 'DOCX' | 'XLSX' | 'PDF'
 */
export const exportFile = async (text, format) => {
  const fileName = `OCR_Result_${Date.now()}`;
  const extension = format.toLowerCase();
  let blob;
  let mimeType = '';

  try {
    // --- 1. 生成 Blob ---
    switch (format) {
      case 'TXT':
        mimeType = 'text/plain;charset=utf-8';
        blob = new Blob([text], { type: mimeType });
        break;

      case 'DOCX':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const doc = new Document({
          sections: [{
            children: text.split('\n').map(line => new Paragraph({
              children: [new TextRun(line)]
            })),
          }],
        });
        blob = await Packer.toBlob(doc);
        break;

      case 'XLSX':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const rows = text.split('\n').map(line => [line]);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "识别结果");
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        blob = new Blob([wbout], { type: mimeType });
        break;

      case 'PDF':
        blob = await generatePdfFromText(text); // 假设此函数返回 Blob
        mimeType = 'application/pdf';
        break;
      
      default:
        throw new Error("不支持的格式");
    }

    if (!blob) return;

    // --- 2. 导出策略选择 ---
    
    // 检查是否在微信环境中
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    const file = new File([blob], `${fileName}.${extension}`, { type: mimeType });

    // 策略 A: 尝试原生分享 (仅限支持的浏览器且非微信)
    if (!isWechat && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'OCR 扫描结果',
          text: '这是为您生成的文档'
        });
        return; // 分享成功，结束
      } catch (shareErr) {
        // 如果用户取消分享会进这里，或者是虽然 canShare 过了但系统最终拒绝
        console.warn("Share API 失败或被取消:", shareErr);
        // 失败后继续走下面的下载逻辑
      }
    }

    // 策略 B: 传统的 <a> 标签下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${extension}`;
    
    // 针对移动端的特殊优化：如果是微信，提示用户长按或右上角打开
    if (isWechat) {
        alert("微信内置浏览器限制下载文件，请点击右上角选择“在浏览器中打开”再进行下载。");
        // 或者弹出一个浮层指引用户
    }

    document.body.appendChild(link);
    link.click();
    
    // 延迟释放，防止下载尚未开始就失效
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);

  } catch (error) {
    console.error("导出具体错误:", error);
    alert(`导出出错: ${error.message}`);
  }
};

/**
 * 辅助函数：通过 Canvas 解决 PDF 中文乱码问题
 */
async function generatePdfFromText(text) {
  // 1. 创建一个离屏 DOM 来排版
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute; left: -9999px; top: 0;
    width: 595px; padding: 40px; 
    background: white; color: black;
    font-size: 14px; line-height: 1.6;
    white-space: pre-wrap; word-wrap: break-word;
    font-family: sans-serif;
  `;
  container.innerText = text;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    
    // A4 纸张尺寸 [595.28, 841.89]
    const pdf = new jsPDF('p', 'pt', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    document.body.removeChild(container);
    return pdf.output('blob');
  } catch (e) {
    document.body.removeChild(container);
    throw e;
  }
}