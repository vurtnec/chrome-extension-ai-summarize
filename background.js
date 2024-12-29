const CONFIG = {
  defaultModel: 'deepseek/deepseek-chat',
  services: {
    openrouter: {
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      models: {
        'deepseek/deepseek-chat': { name: 'DeepSeek Chat' },
        'anthropic/claude-3-haiku': { name: 'Claude 3 Haiku' },
        'openai/gpt-4o-mini': { name: 'OpenAI GPT-4o-mini' },
      },
      headers: (apiKey) => ({
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Chrome Extension Summarization Tool'
      }),
      formatRequest: (model, messages) => ({
        model: model,
        messages: messages
      }),
      formatResponse: (response) => response.choices[0]?.message?.content
    },
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      models: {
        'gpt-4o': { name: 'GPT-4o' },
        'gpt-4o-mini': { name: 'GPT-4o-mini' }
      },
      headers: (apiKey) => ({
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }),
      formatRequest: (model, messages) => ({
        model: model,
        messages: messages
      }),
      formatResponse: (response) => response.choices[0]?.message?.content
    },
    ollama: {
      name: 'Ollama',
      baseUrl: 'http://localhost:11434/api/chat',
      models: {
        'llama2': { name: 'Llama 2' },
        'qwen2.5:7b': { name: 'Qwen 2.5 7B' },
        'qwen2.5-coder:14b': { name: 'Qwen 2.5 Coder 14B' }
      },
      headers: () => ({
        'Content-Type': 'application/json'
      }),
      formatRequest: (model, messages) => ({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: false
      }),
      formatResponse: (response) => response.message?.content
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

async function getCurrentService() {
  const result = await chrome.storage.sync.get(['service', 'model']);
  const service = result.service || 'openrouter';
  const model = result.model || CONFIG.defaultModel;
  return { service, model };
}

async function getApiKey(service) {
  const result = await chrome.storage.sync.get([`${service}_api_key`]);
  return result[`${service}_api_key`];
}

async function sendToAIService(service, model, apiKey, messages) {
  const serviceConfig = CONFIG.services[service];
  if (!serviceConfig) {
    throw new Error('Service not configured');
  }

  const response = await fetch(serviceConfig.baseUrl, {
    method: 'POST',
    headers: serviceConfig.headers(apiKey),
    body: JSON.stringify(serviceConfig.formatRequest(model, messages))
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return serviceConfig.formatResponse(data);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToOpenRouter") {
    handleAIRequest(request.text, sendResponse);
    return true;
  }
  if (request.action === "getConfig") {
    sendResponse({ config: CONFIG });
    return true;
  }
});

async function handleAIRequest(text, sendResponse) {
  try {
    const { service, model } = await getCurrentService();
    const apiKey = await getApiKey(service);
    
    if (!apiKey) {
      throw new Error('API key not found. Please set it in the extension settings.');
    }

    const messages = [
      {
        role: "system",
        content: "You are a text summarization assistant. Your task is to provide clear, concise summaries of the given text while maintaining the key points and important details. Keep the summary focused and well-structured. Regardless of the language of the input text, please reply in Chinese."
      },
      {
        role: "user",
        content: `Please summarize the following text:\n\n${text}`
      }
    ];

    const summary = await sendToAIService(service, model, apiKey, messages);
    sendResponse({ success: true, summary });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
} 