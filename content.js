let isExtensionActive = true;

function createPopup() {
  try {
    const existingContainer = document.querySelector('.ai-summarizer-popup');
    if (existingContainer) {
      document.body.removeChild(existingContainer);
    }

    const container = document.createElement('div');
    container.className = 'ai-summarizer-popup';
    
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
    
    container.appendChild(popup);
    document.body.appendChild(container);
    
    document.getElementById('summary-popup-close').addEventListener('click', () => {
      closePopup(container);
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('#summary-popup')) {
        const container = document.querySelector('.ai-summarizer-popup');
        if (container) {
          closePopup(container);
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const container = document.querySelector('.ai-summarizer-popup');
        if (container) {
          closePopup(container);
        }
      }
    });
    
    return popup;
  } catch (error) {
    console.error('Failed to create popup:', error);
    return null;
  }
}

function closePopup(container) {
  const popup = container.querySelector('#summary-popup');
  if (popup) {
    popup.style.opacity = '0';
    popup.style.transform = 'translate(-50%, -48%)';
  }
  setTimeout(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }, 300);
}

function showSummary(text, loading = false) {
  try {
    let popup = document.getElementById('summary-popup');
    if (!popup) {
      popup = createPopup();
      if (!popup) return;
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
  } catch (error) {
    console.error('Failed to show summary:', error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (chrome.runtime.lastError) {
    isExtensionActive = false;
    return;
  }
  if (request.action === "summarize") {
    createPopup();
    showSummary('', true);
    
    chrome.runtime.sendMessage({
      action: "sendToOpenRouter",
      text: request.text
    }, response => {
      if (chrome.runtime.lastError) {
        showSummary('Extension error: Please refresh the page');
        return;
      }
      if (response.success) {
        showSummary(response.summary);
      } else {
        showSummary(`Error: ${response.error}`);
      }
    });
  }
});

document.addEventListener('keydown', (event) => {
  if (!isExtensionActive) return;
  
  if (event.altKey && event.code === 'KeyS') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      try {
        createPopup();
        showSummary('', true);
        
        chrome.runtime.sendMessage({
          action: "sendToOpenRouter",
          text: selectedText
        }, response => {
          if (chrome.runtime.lastError) {
            showSummary('Extension error: Please refresh the page');
            return;
          }
          if (response.success) {
            showSummary(response.summary);
          } else {
            showSummary(`Error: ${response.error}`);
          }
        });
      } catch (error) {
        console.error('Extension error:', error);
        showSummary('Extension error: Please refresh the page');
      }
    } else {
      showSummary("Please select text first.");
    }
  }
}); 