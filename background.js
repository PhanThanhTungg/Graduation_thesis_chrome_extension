startAlarm();

chrome.runtime.onInstalled.addListener(() => {
  startAlarm();
  setTimeout(() => {
    showPopupToAllTabs();
  }, 1000);
});

chrome.runtime.onStartup.addListener(() => {
  startAlarm();
  setTimeout(() => {
    showPopupToAllTabs();
  }, 1000);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'showPopupAlarm') {
    console.log('Alarm được kích hoạt - hiển thị popup cho tất cả tab');
    showPopupToAllTabs();
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && 
      (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    setTimeout(async () => {
      await injectAndShowPopup(tabId);
    }, 500);
  }
});

function startAlarm() {
  chrome.alarms.clear('showPopupAlarm');
  
  chrome.alarms.create('showPopupAlarm', {
    delayInMinutes: 1,  
    periodInMinutes: 1  
  });
  
  console.log('Alarm đã được khởi động - sẽ hiển thị popup mỗi 1 phút');
}

async function injectAndShowPopup(tabId) {
  try {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['popup.css']
      });
    } catch (injectError) {
      console.log('Script có thể đã được inject:', tabId);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'showPopup' });
      console.log('Đã gửi message đến tab:', tabId);
    } catch (e) {
      console.log('Không thể gửi message đến tab:', tabId, e);
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId, { action: 'showPopup' });
        } catch (e2) {
          console.log('Vẫn không thể gửi message đến tab:', tabId);
        }
      }, 500);
    }
  } catch (error) {
    console.log('Lỗi khi inject/show popup cho tab:', tabId, error);
  }
}

async function showPopupToAllTabs() {
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      await injectAndShowPopup(tab.id);
    }
  }
}

