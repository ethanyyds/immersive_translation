// content.js - 内容脚本
console.log("内容脚本已注入，等待指令。");

/**
 * 将翻译结果插入到页面中。
 * @param {HTMLElement} originalElement - 原始段落元素。
 * @param {string} translatedText - 翻译后的文本。
 */
function insertTranslation(originalElement, translatedText) {
  if (!translatedText) return;

  const isListItem = originalElement.tagName.toLowerCase() === 'li';

  // 对于列表项，使用 <div> 包裹译文并放在 <li> 内部，避免破坏列表结构
  const translationElement = document.createElement(isListItem ? 'div' : 'p');
  translationElement.innerText = translatedText;

  // 给译文添加一些样式
  translationElement.style.color = 'cornflowerblue';
  translationElement.style.fontStyle = 'italic';
  translationElement.style.fontSize = '0.9em';
  originalElement.style.marginBottom = '0.2em';
  translationElement.style.marginTop = '0em';

  if (isListItem) {
    // 插入到 <li> 内部
    originalElement.appendChild(translationElement);
  } else {
    // 将译文元素插入到原始元素下方
    originalElement.insertAdjacentElement('afterend', translationElement);
  }
}

/**
 * 批量翻译页面中的文本元素（段落、标题、列表项等）。
*/
function translatePage() {
  const selector = [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'li'
  ]
    .map(tag => `${tag}:not([data-translated="true"])`)
    .join(', ');

  const elements = document.querySelectorAll(selector);
  console.log(`找到了 ${elements.length} 个新的元素进行翻译。`);

  if (elements.length === 0) {
    console.log("没有需要翻译的新内容。");
    return;
  }

  // 收集所有需要翻译的文本
  const textsToTranslate = [];
  const elementsToTranslate = [];

  elements.forEach(el => {
    const originalText = el.innerText;
    if (originalText.trim().length > 0) {
      textsToTranslate.push(originalText);
      elementsToTranslate.push(el);
      // 先标记，防止重复翻译
      el.dataset.translated = "true";
    }
  });

  if (textsToTranslate.length === 0) {
    console.log("没有有效的文本需要翻译。");
    return;
  }

  console.log(`准备批量翻译 ${textsToTranslate.length} 个文本元素`);

  // 发送批量翻译请求到 background.js
  chrome.runtime.sendMessage(
    { 
      action: "translate_batch", 
      texts: textsToTranslate 
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("批量翻译请求失败:", chrome.runtime.lastError.message);
        // 如果失败，移除标记，允许重试
        elementsToTranslate.forEach(p => {
          delete p.dataset.translated;
        });
        return;
      }
      
      if (response.error) {
        console.error("批量翻译API错误:", response.error);
        // 如果失败，移除标记，允许重试
        elementsToTranslate.forEach(p => {
          delete p.dataset.translated;
        });
      } else if (response.translatedTexts && Array.isArray(response.translatedTexts)) {
        console.log(`收到 ${response.translatedTexts.length} 个翻译结果`);
        
        // 将翻译结果插入到对应的段落
        response.translatedTexts.forEach((translatedText, index) => {
          if (index < elementsToTranslate.length) {
            insertTranslation(elementsToTranslate[index], translatedText);
          }
        });
        
        console.log("批量翻译完成！");
      } else {
        console.error("批量翻译响应格式错误:", response);
      }
    }
  );
}

// 监听来自 popup 的指令
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("接收到指令:", request);
  if (request.action === "translate_page") {
    translatePage();
    sendResponse({ status: "批量翻译任务已启动" });
  }
  return true;
}); 