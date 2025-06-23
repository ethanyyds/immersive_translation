// content.js - 内容脚本
console.log("内容脚本已注入，等待指令。");

/**
 * 将翻译结果插入到页面中。
 * @param {HTMLElement} originalElement - 原始段落元素。
 * @param {string} translatedText - 翻译后的文本。
 */
function insertTranslation(originalElement, translatedText) {
  if (!translatedText) return;

  // 创建一个新的 <p> 元素来显示译文
  const translationElement = document.createElement('p');
  translationElement.innerText = translatedText;

  // 给译文添加一些样式
  translationElement.style.color = 'cornflowerblue';
  translationElement.style.fontStyle = 'italic';
  translationElement.style.fontSize = '0.9em';
  originalElement.style.marginBottom = '0.2em';
  translationElement.style.marginTop = '0em';

  // 将译文元素插入到原始段落的下方
  originalElement.insertAdjacentElement('afterend', translationElement);
}

/**
 * 遍历并翻译页面中的段落。
 */
function translatePage() {
  // 仅选择尚未被标记为已翻译的 <p> 元素
  const paragraphs = document.querySelectorAll('p:not([data-translated="true"])');
  console.log(`找到了 ${paragraphs.length} 个新的段落进行翻译。`);

  if (paragraphs.length === 0) {
    console.log("没有需要翻译的新段落。");
    return;
  }

  paragraphs.forEach(p => {
    const originalText = p.innerText;

    // 确保段落有实际文本内容
    if (originalText.trim().length > 0) {
      // 1. 先标记，防止重复发送请求
      p.dataset.translated = "true";

      // 2. 发送消息到 background.js 请求翻译
      chrome.runtime.sendMessage(
        { action: "translate_text", text: originalText },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("翻译请求失败:", chrome.runtime.lastError.message);
            // 可选：如果失败，可以把标记移除，允许重试
            // delete p.dataset.translated;
            return;
          }
          
          if (response.error) {
            console.error("翻译API错误:", response.error);
          } else if (response.translatedText) {
            // 3. 收到翻译结果后，插入到页面
            insertTranslation(p, response.translatedText);
          }
        }
      );
    }
  });
}

// 监听来自 popup 或其他地方的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("接收到消息:", request);
  if (request.action === "translate_page") {
    translatePage();
    sendResponse({ status: "翻译任务已启动" });
  }
  return true; // 保持消息通道开放，用于异步响应
}); 