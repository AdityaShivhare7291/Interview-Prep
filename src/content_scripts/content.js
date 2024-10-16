const contentScriptPort = chrome.runtime.connect({
    name: "content_scripts_connection"
});

const addArticleReadTime = () => {
    const article = document.querySelector("article");

    if (article) {
        const text = article.textContent;
        const wordMatchRegExp = /[^\s]+/g;
        const words = text.matchAll(wordMatchRegExp);

        const wordCount = [...words].length;
        const readingTime = Math.round(wordCount / 220);
        const badge = document.createElement("div");
        badge.style.fontSize = '15px';
        badge.style.marginBottom = '10px';
        const badgeItems = `
        <div class="cm_feature_rtime_focus" >
        <p>⏱ ${readingTime} min read</p>
            <button class="ds_footer_btn cm_feature_focus_mode_text" type="button" id="focusModeId">
                Focus mode
            </button>
    </div>`

        badge.innerHTML = badgeItems;

        const heading = article.querySelector("h1");
        heading.insertAdjacentElement("afterend", badge);

    }
}

const addListenerToFocusMode = () => {
    const focusModeElement = document.getElementById('focusModeId');
    focusModeElement?.addEventListener('click', async () => {

        if (focusModeElement.classList.contains('active_focus_mode')) {
            contentScriptPort.postMessage({ uninjectCss: true });
            focusModeElement.classList.remove('active_focus_mode');
        } else {
            contentScriptPort.postMessage({ injectCss: true });
            focusModeElement.classList.add('active_focus_mode');
        }
    });
}

const addArticleListenControls = () => {
    const body = document.body;

    const controlCover = document.createElement('div');
    controlCover.className = 'cm_control_cover';
    controlCover.id = 'cmDraggableListenControlsId'
    controlCover.draggable = true;

    controlCover.innerHTML = `<div class="cm_control_left_cover">
    <div>
        <p class="cm_interview_text">Interview experiences/articles</p>
        <div class="cm_control_btns_cover">
            <button class="ds_footer_btn" type="button" id="readArticleReadId">
                Listen
            </button>
            <button class="ds_footer_btn" type="button" id="readArticlePauseId">
                Pause
            </button>
            <button class="ds_footer_btn" type="button" id="readArticleStopId">
                 Cancel
            </button>
            <select id="readSpeedRateId" class="ds_footer_select">
                <option value='0.25' >0.25x</option>
                <option value='0.5' >0.5x</option>
                <option value='0.75' >0.75x</option>
                <option value='1.0' selected >1.0x</option>
                <option value='1.5' >1.5x</option>
                <option value='2.0' >2x</option>
                <option value='3.0' >3x</option>
            </select>
        </div>
    </div>
</div>`

    body.append(controlCover);
}

const createDraggableControls = () => {
    const draggableListenControls = document.getElementById('cmDraggableListenControlsId');

    let offsetX, offsetY;
    let isDragging = false;

    draggableListenControls.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - draggableListenControls.getBoundingClientRect().left;
        offsetY = e.clientY - draggableListenControls.getBoundingClientRect().top;
        draggableListenControls.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        draggableListenControls.style.cursor = 'grab';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        draggableListenControls.style.left = e.clientX - offsetX + 'px';
        draggableListenControls.style.top = e.clientY - offsetY + 'px';
    });
}

const addListenerToReadArticle = () => {
    const pauseResumeBtn = document.getElementById('readArticlePauseId');

    document.getElementById('readArticleReadId')?.addEventListener('click', () => {

        if (pauseResumeBtn.textContent.toLowerCase() !== 'resume') {
            const rate = document.getElementById('readSpeedRateId').value;
            let articleElement = document.querySelector('.text');
            if (articleElement) {

                let articleContent;

                const articleCopy = articleElement.cloneNode(true);

                const codeBlockElements = articleCopy.querySelectorAll('.code-block');
                const codeBlockResponsiveElements = articleCopy.querySelectorAll('.responsive-tabs-wrapper');

                codeBlockElements.forEach((codeBlock) => {
                    codeBlock.remove();
                });
                codeBlockResponsiveElements.forEach((codeBlock) => {
                    codeBlock.remove();
                });

                const articleText = articleCopy.textContent;

                const wordMatchRegExp = /[^\s]+/g;
                const articleWords = articleText.matchAll(wordMatchRegExp);

                let articleTitle = document.querySelector('article').children[0].textContent;
                const articleTitleWords = articleTitle.matchAll(wordMatchRegExp);

                let wholeArticle = [...articleTitleWords].concat([...articleWords]);

                articleContent = wholeArticle.join(' ');

                const utterance = {
                    'lang': "en-US",
                    'rate': parseFloat(rate),
                }

                contentScriptPort.postMessage({
                    source: 'content_script',
                    play: true,
                    utterance,
                    articleContent: articleContent
                });
            } else {
                alert("This feature supports only reading interview experiences/articles. - Career Matrix");
            }
        }

    });
}

const addListenerToPauseArticle = () => {
    const pauseResumeArticle = document.getElementById('readArticlePauseId');

    pauseResumeArticle.addEventListener('click', (event) => {
        
        const pauseResumeValue = event.target.textContent.toLowerCase();

        if (document.querySelector('.text')) {
            const pauseMessage = {
                source: 'content_script',
                pause: true
            };
            const resumeMessage = {
                source: 'content_script',
                resume: true
            }
            const messagePayload = pauseResumeValue === 'pause' ? pauseMessage : resumeMessage;

            contentScriptPort.postMessage(messagePayload);
        }
    });
}

const addListenerToStopArticle = () => {
    document.getElementById('readArticleStopId')?.addEventListener('click', () => {

        document.querySelector('.text') &&
            contentScriptPort.postMessage({
                source: 'content_script',
                stop: true
            });
    });
}

const executeContentScript = () => {
    addArticleReadTime();
    addListenerToFocusMode();

    chrome.storage.sync.get(null, (result) => {
        if(result.listenArticleGfg !== 'off') {
            addArticleListenControls();
            addListenerToReadArticle();
            addListenerToPauseArticle();
            addListenerToStopArticle();
            createDraggableControls();
        }
    });
}

executeContentScript();

const handleReadStateBtns = (readState) => {
    const readBtn = document.getElementById('readArticleReadId');
    const pauseBtn = document.getElementById('readArticlePauseId');

    if (readState === 'start') {
        readBtn.classList.add('cm_control_active_state');
        pauseBtn.textContent = 'Pause';
    } else if (readState === 'pause') {
        readBtn.classList.remove('cm_control_active_state');
        pauseBtn.textContent = 'Resume';
    } else if (readState === 'resume') {
        readBtn.classList.add('cm_control_active_state');
        pauseBtn.textContent = 'Pause';
    } else if (readState === 'end') {
        readBtn.classList.remove('cm_control_active_state');
        pauseBtn.textContent = 'Pause';
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.storageChange) {
        // console.log('Storage has changed.', sender);
        chrome.storage.sync.get(['listenCurrentState'], (result) => {
            const readState = result?.listenCurrentState
            handleReadStateBtns(readState);
        });
    }
});

chrome.storage.sync.get(['listenCurrentState'], (result) => {
    const readState = result?.listenCurrentState;
    handleReadStateBtns(readState);
});


contentScriptPort.onDisconnect.addListener((port) => {
    if (chrome.runtime.lastError) {
        // console.log("Ondisconnect: ", chrome.runtime.lastError);
    }

    // console.log("Disconnected...", port);
});