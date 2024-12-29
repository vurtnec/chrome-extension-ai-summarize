const CONFIG = {
  defaultModel: 'deepseek/deepseek-chat',
  models: {
    'deepseek/deepseek-chat': {
      name: 'DeepSeek Chat',
      apiUrl: "https://openrouter.ai/api/v1/chat/completions"
    }
  }
};

// 创建上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarizeText",
    title: "Summarize Text",
    contexts: ["selection"]
  });
});

// 处理上下文菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarizeText") {
    chrome.tabs.sendMessage(tab.id, {
      action: "summarize",
      text: info.selectionText
    });
  }
});

// 处理来自content script的API请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToOpenRouter") {
    chrome.storage.sync.get(['openrouter_api_key'], function(result) {
      const apiKey = result.openrouter_api_key;
      
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Title": "Chrome Extension Summarization Tool"
        },
        body: JSON.stringify({
          "model": CONFIG.defaultModel,
          "messages": [
            {
              "role": "system",
              "content": "You are a text summarization assistant. Your task is to provide clear, concise summaries of the given text while maintaining the key points and important details. Keep the summary focused and well-structured. Regardless of the language of the input text, please reply in Chinese."
            },
            {
              "role": "user",
              "content": `Please summarize the following text:\n\n${request.text}`
            }
          ]
        })
      })
      .then(response => response.json())
      .then(data => {
        sendResponse({
          success: true,
          summary: data.choices[0]?.message?.content
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    });
    return true; // 保持消息通道打开
  }
}); 