// popup.js
console.log("Popup 脚本已加载。");

document.addEventListener('DOMContentLoaded', function() {
  const translateBtn = document.getElementById('translateBtn');

  if (translateBtn) {
    translateBtn.addEventListener('click', async () => {
      console.log("点击了翻译按钮");
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.id) {
        console.log(`向 Tab ${tab.id} 发送消息`);
        chrome.tabs.sendMessage(tab.id, { action: "translate_page" }, (response) => {
          // 检查是否在发送消息时发生错误
          if (chrome.runtime.lastError) {
            console.error("发送消息失败: ", chrome.runtime.lastError.message);
            // 这里可以给用户一些提示，比如刷新页面重试
          } else {
            console.log("来自内容脚本的响应:", response?.status);
          }
        });
      }
    });
  }
}); 