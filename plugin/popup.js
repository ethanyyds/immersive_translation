// popup.js
console.log("Popup 脚本已加载。");

document.addEventListener('DOMContentLoaded', function() {
  const translateBtn = document.getElementById('translateBtn');
  const statusDiv = document.getElementById('status');

  // 翻译页面功能
  translateBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.id) {
      statusDiv.textContent = '正在翻译...';
      statusDiv.style.color = 'blue';
      
      chrome.tabs.sendMessage(tab.id, { action: "translate_page" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("发送消息失败: ", chrome.runtime.lastError.message);
          statusDiv.textContent = `翻译指令发送失败。请刷新页面后重试。`;
          statusDiv.style.color = 'red';
        } else {
          console.log("来自内容脚本的响应:", response?.status);
          statusDiv.textContent = '翻译指令已发送！';
          statusDiv.style.color = 'green';
          setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        }
      });
    }
  });
}); 