// background.js - 后台脚本
// 目前留空，用于将来的后台任务处理
console.log("后台脚本已加载。");

async function translateText(text) {
  if (!text || text.trim() === '') {
    return { translatedText: '' };
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("翻译服务器响应:", data);
    
    if (data.translatedText) {
      return { translatedText: data.translatedText };
    } else {
      return { error: data.error || "翻译失败" };
    }
  } catch (error) {
    console.error('翻译服务器请求失败:', error);
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