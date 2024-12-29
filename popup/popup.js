document.addEventListener('DOMContentLoaded', async () => {
  const serviceSelect = document.getElementById('service');
  const modelSelect = document.getElementById('model');
  const apiKeyInput = document.getElementById('apiKey');
  const targetLangSelect = document.getElementById('targetLang');
  const saveButton = document.getElementById('saveButton');
  
  // 从后台页面获取配置
  const config = await new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'getConfig' }, response => {
      resolve(response.config);
    });
  });
  
  // 加载保存的设置
  const settings = await chrome.storage.sync.get(['service', 'model', 'targetLang']);
  const currentService = settings.service || 'openrouter';
  const currentLang = settings.targetLang || 'zh';
  
  serviceSelect.value = currentService;
  targetLangSelect.value = currentLang;
  
  // 加载API密钥
  const apiKeyResult = await chrome.storage.sync.get([`${currentService}_api_key`]);
  apiKeyInput.value = apiKeyResult[`${currentService}_api_key`] || '';
  
  // 更新模型选项
  function updateModelOptions(service) {
    const models = config.services[service].models;
    modelSelect.innerHTML = Object.entries(models)
      .map(([value, model]) => `<option value="${value}">${model.name}</option>`)
      .join('');
    
    // 设置当前选中的模型
    if (settings.model && models[settings.model]) {
      modelSelect.value = settings.model;
    }
  }
  
  // 初始化模型选项
  updateModelOptions(currentService);
  
  // 服务切换时更新模型列表和API密钥
  serviceSelect.addEventListener('change', async (e) => {
    const service = e.target.value;
    updateModelOptions(service);
    
    // 加载对应服务的API密钥
    const apiKeyResult = await chrome.storage.sync.get([`${service}_api_key`]);
    apiKeyInput.value = apiKeyResult[`${service}_api_key`] || '';
  });
  
  // 保存设置
  saveButton.addEventListener('click', async () => {
    const service = serviceSelect.value;
    const model = modelSelect.value;
    const apiKey = apiKeyInput.value;
    const targetLang = targetLangSelect.value;
    
    try {
      // 保存设置
      await chrome.storage.sync.set({
        service: service,
        model: model,
        targetLang: targetLang,
        [`${service}_api_key`]: apiKey
      });
      
      // 显示保存成功提示
      saveButton.classList.add('success');
      saveButton.innerHTML = `
        <span>Saved!</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
      `;
      
      setTimeout(() => {
        saveButton.classList.remove('success');
        saveButton.innerHTML = `
          <span>Save Settings</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        `;
      }, 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  });
}); 