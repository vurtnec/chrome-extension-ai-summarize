document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['openrouter_api_key', 'defaultModel'], function(result) {
    document.getElementById('apiKey').value = result.openrouter_api_key || '';
    document.getElementById('model').value = result.defaultModel || 'deepseek/deepseek-chat';
  });

  document.getElementById('saveButton').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    
    chrome.storage.sync.set({
      openrouter_api_key: apiKey,
      defaultModel: model
    }, function() {
      alert('Settings saved successfully!');
    });
  });
}); 