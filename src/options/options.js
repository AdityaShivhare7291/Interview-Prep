const saveOptions = () => {
    const openLinkModeValue = document.getElementById('openLinkModeId').value;
    const autoExpandLinkedInValue = document.getElementById('autoExpandLinkedInId').value;
    const listenPostLinkedInValue = document.getElementById('listenPostLinkedInId').value; 
    const listenArticleGfgValue = document.getElementById('listenArticleGfgId').value;
  
    chrome.storage.sync.set(
      { 
        openLinkMode: openLinkModeValue,
        autoExpandLinkedIn: autoExpandLinkedInValue,
        listenPostLinkedIn: listenPostLinkedInValue,
        listenArticleGfg: listenArticleGfgValue
      },
      () => {

        const status = document.getElementById('status');
        status.textContent = 'Settings saved successfully.';
        setTimeout(() => {
          status.textContent = '';
        }, 750);

      }
    );
  };
  

  const restoreOptions = () => {
    chrome.storage.sync.get(
      { 
        openLinkMode: 'normal',
        autoExpandLinkedIn: 'on',
        listenPostLinkedIn: 'on',
        listenArticleGfg: 'on' 
      },
      (items) => {
        document.getElementById('openLinkModeId').value = items.openLinkMode;
        document.getElementById('autoExpandLinkedInId').value = items.autoExpandLinkedIn;
        document.getElementById('listenPostLinkedInId').value = items.listenPostLinkedIn;
        document.getElementById('listenArticleGfgId').value = items.listenArticleGfg;
      }
    );
  };
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);