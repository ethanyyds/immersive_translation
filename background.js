// background.js - 后台脚本
// 目前留空，用于将来的后台任务处理
console.log("后台脚本已加载。");

async function translateText(text, targetLang = 'zh-CN', sourceLang = 'en') {
  if (!text || text.trim() === '') {
    return { translatedText: '' };
  }

  // 假设我们自动检测源语言，目标语言为中文
  const langPair = `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("翻译 API 响应:", data);
    // MyMemory API 成功时返回的结构包含 responseData
    if (data.responseData) {
      return { translatedText: data.responseData.translatedText };
    } else {
      // 如果没有 responseData，可能是一个错误或不同的响应格式
      return { error: "无法解析翻译结果" };
    }
  } catch (error) {
    console.error('翻译 API 请求失败:', error);
    return { error: error.message };
  }
}


// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate_text") {
    console.log(`收到翻译请求: "${request.text}"`);
    translateText(request.text).then(sendResponse);
    return true; // 表示我们将异步发送响应
  }
}); 