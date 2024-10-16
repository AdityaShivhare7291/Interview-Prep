// console.log("Background script running ...");

chrome.runtime.onConnect.addListener((port) => {
    // console.log(port);
    if (port.name === 'popup_connection') {
        // console.log("Connected to popup");
    } else if (port.name === 'content_scripts_connection') {
        // console.log("Connected to content scripts");
    }

    port.onMessage.addListener((message, sender, sendResponse) => {
        // console.log(message);

        if (message.injectCss) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab) {

                    chrome.scripting.insertCSS({
                        target: { tabId: activeTab.id },
                        files: ['focusMode.css'],
                    });
                }
            });
        } else if (message.uninjectCss) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab) {
                    chrome.scripting.removeCSS({
                        target: { tabId: activeTab.id },
                        files: ['focusMode.css'],
                    });

                }
            });
        } else if (message.source == 'content_script') {
            if (message.play) {
                if (message.articleContent) {
                    speakArticle({
                        articleContent: message.articleContent,
                        utterance: message.utterance,
                    });
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        const activeTab = tabs[0];
                        if (activeTab) {
                            chrome.storage.sync.set({ recentReadUrl: port.sender?.url });
                        }
                    });
                }
            } else if (message.pause) {
                chrome.tts.pause();
            } else if (message.resume) {
                chrome.tts.resume();
            } else if (message.stop) {
                chrome.tts.stop();
                chrome.storage.sync.set({ listenCurrentState: 'end' });

            }
        }
    });

});

function speakArticle({ articleContent, utterance }) {
    let voiceText = articleContent;
    utterance.onEvent = function (event) {

        switch (event.type) {
            case 'start':
                // console.log('start');
                chrome.storage.sync.set({ listenCurrentState: 'start' });
                break;
            case 'end':
                // console.log('end');
                chrome.storage.sync.set({ listenCurrentState: 'end' });
                break;
            case 'resume':
                // console.log('resume');
                chrome.storage.sync.set({ listenCurrentState: 'start' });
                break;
            case 'pause':
                // console.log('pause');
                chrome.storage.sync.set({ listenCurrentState: 'pause' });
                break;
            case 'interrupted':
                // console.log('interrupted');
                chrome.storage.sync.set({ listenCurrentState: 'end' });
                break;
            case 'cancelled':
                // console.log('cancelled');
                chrome.storage.sync.set({ listenCurrentState: 'end' });
                break;
            case 'error':
                // console.log('Error: ', event.errorMessage);
                chrome.storage.sync.set({ listenCurrentState: 'end' });
                break;
        }
    }
    chrome.tts.speak(
        voiceText,
        utterance,
        function () {
            if (chrome.runtime.lastError) {
                // console.log('Error: ' + chrome.runtime.lastError.message);
            }
        }
    );
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'sync') {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(function (tab) {
                if (tab.url.startsWith('https://www.geeksforgeeks.org/')) {
                    chrome.tabs.sendMessage(tab.id, { storageChange: true });
                }
            });
        });
    }
});


