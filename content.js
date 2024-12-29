// 创建弹窗HTML
function createPopup() {
  // 先移除可能存在的旧弹窗
  const existingPopup = document.getElementById('summary-popup');
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  const popup = document.createElement('div');
  popup.id = 'summary-popup';
  popup.innerHTML = `
    <span id="summary-popup-close">×</span>
    <h2>文本摘要</h2>
    <div id="summary-popup-content">
      <div class="loading-container">
        <div class="loading-spinner"></div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  
  // 添加关闭按钮事件
  document.getElementById('summary-popup-close').addEventListener('click', () => {
    closePopup(popup);
  });

  // 添加点击外部关闭
  document.addEventListener('click', (event) => {
    if (event.target.closest('#summary-popup')) return;
    const popup = document.getElementById('summary-popup');
    if (popup) {
      closePopup(popup);
    }
  });

  // 添加 ESC 键关闭
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const popup = document.getElementById('summary-popup');
      if (popup) {
        closePopup(popup);
      }
    }
  });
  
  return popup;
}

function closePopup(popup) {
  popup.style.opacity = '0';
  popup.style.transform = 'translate(-50%, -48%)';
  setTimeout(() => {
    if (document.body.contains(popup)) {
      document.body.removeChild(popup);
    }
  }, 300);
}

function showSummary(text) {
  let popup = document.getElementById('summary-popup');
  if (!popup) {
    popup = createPopup();
  }
  const contentElement = popup.querySelector('#summary-popup-content');
  contentElement.innerHTML = `<div class="summary-content">${text}</div>`;
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    createPopup();
    
    chrome.runtime.sendMessage({
      action: "sendToOpenRouter",
      text: request.text
    }, response => {
      if (response.success) {
        showSummary(response.summary);
      } else {
        showSummary(`Error: ${response.error}`);
      }
    });
  }
});

// 添加快捷键支持
document.addEventListener('keydown', (event) => {
  if (event.altKey && event.code === 'KeyS') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "sendToOpenRouter",
        text: selectedText
      }, response => {
        if (response.success) {
          showSummary(response.summary);
        } else {
          showSummary(`Error: ${response.error}`);
        }
      });
    } else {
      showSummary("No text selected. Please select some text first.");
    }
  }
}); 