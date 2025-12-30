
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
      <div class="popup-header">
        <h2>Bài tập C++</h2>
        <button id="close-popup">×</button>
      </div>
      <div class="question-section">
        <p class="question-text">Đề bài: Cho đoạn code C++ sau, hãy chọn đáp án đúng:</p>
        <pre class="code-snippet">int x = 5;
int y = x++;
cout << x << " " << y;</pre>
        
        <div class="question">
          <p class="question-title">Giá trị của x và y lần lượt là:</p>
          <label class="option">
            <input type="radio" name="q1" value="a">
            <span>A. 6 và 5</span>
          </label>
          <label class="option">
            <input type="radio" name="q1" value="b">
            <span>B. 5 và 6</span>
          </label>
          <label class="option">
            <input type="radio" name="q1" value="c">
            <span>C. 6 và 6</span>
          </label>
          <label class="option">
            <input type="radio" name="q1" value="d">
            <span>D. 5 và 5</span>
          </label>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(popupElement);
  
  setTimeout(() => {
    if (popupElement) {
      popupElement.remove();
      popupElement = null;
    }
  }, 60000);
  
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

