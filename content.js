
let popupElement = null;
let hasShownInitialPopup = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script nhận được message:', request);
  if (request.action === 'showPopup') {
    showPopup();
    sendResponse({ success: true });
  }
  return true; 
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (!hasShownInitialPopup) {
        console.log('Hiển thị popup lần đầu khi trang load');
        showPopup();
        hasShownInitialPopup = true;
      }
    }, 1000); 
  });
} else {
  setTimeout(() => {
    if (!hasShownInitialPopup) {
      console.log('Hiển thị popup lần đầu (trang đã load)');
      showPopup();
      hasShownInitialPopup = true;
    }
  }, 1000);
}

function showPopup() {
  console.log('showPopup được gọi');
  if (!document.body) {
    setTimeout(showPopup, 100);
    return;
  }
  
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
  
  popupElement = document.createElement('div');
  popupElement.id = 'hello-friend-popup';
  popupElement.innerHTML = `
    <div class="popup-content">
      <h2>Hello my friend</h2>
      <button id="close-popup">Đóng</button>
    </div>
  `;
  
  document.body.appendChild(popupElement);
  
  setTimeout(() => {
    if (popupElement) {
      popupElement.remove();
      popupElement = null;
    }
  }, 3000);
  
  const closeButton = popupElement.querySelector('#close-popup');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      if (popupElement) {
        popupElement.remove();
        popupElement = null;
      }
    });
  }
}

