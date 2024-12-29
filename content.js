function createPopup() {
  const existingPopup = document.getElementById('summary-popup');
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  const popup = document.createElement('div');
  popup.id = 'summary-popup';
  popup.innerHTML = `
    <span id="summary-popup-close">×</span>
    <h2>Text Summary</h2>
    <div id="summary-popup-content">
      <div class="loading-container">
        <div class="loading-spinner"></div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  
  document.getElementById('summary-popup-close').addEventListener('click', () => {
    closePopup(popup);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('#summary-popup')) return;
    const popup = document.getElementById('summary-popup');
    if (popup) {
      closePopup(popup);
    }
  });

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

function showSummary(text, loading = false) {
  let popup = document.getElementById('summary-popup');
  if (!popup) {
    popup = createPopup();
  }
  const contentElement = popup.querySelector('#summary-popup-content');
  
  if (loading) {
    contentElement.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p style="margin-top: 16px; color: #666;">Generating summary...</p>
      </div>
    `;
  } else {
    contentElement.innerHTML = `<div class="summary-content">${text}</div>`;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    createPopup();
    showSummary('', true);
    
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

document.addEventListener('keydown', (event) => {
  if (event.altKey && event.code === 'KeyS') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      createPopup();
      showSummary('', true); 
      
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
      showSummary("Please select text first.");
    }
  }
}); 