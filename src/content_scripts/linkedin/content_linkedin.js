// console.log("LinkedIn content scripts...");

let voices = [];

const tts = window.speechSynthesis;
voices = tts.getVoices();

if (voices.length === 0) {
    tts.addEventListener('voiceschanged', () => {
        voices = tts.getVoices();
    });
}

const activateAutoReadMoreClick = () => {
    // chrome.storage.sync.get(['autoExpandLinkedIn'], (result) => {
    //     if (result.autoExpandLinkedIn == 'on') {
    window.addEventListener("scroll", () => {
        const buttons = document.querySelectorAll(".feed-shared-inline-show-more-text__see-more-less-toggle");

        buttons.forEach(button => {
            const buttonPosition = button.getBoundingClientRect().top;
            const triggerPosition = 300;

            if (buttonPosition < triggerPosition) {
                button.click();
            }
        });
    });
    // }
    // });
}

const appendListenControls = () => {

    const body = document.body;

    const controlCover = document.createElement('div');
    controlCover.className = 'cm_control_cover';
    controlCover.id = 'cmDraggableListenControlsId'
    controlCover.draggable = true;

    controlCover.innerHTML = `<div class="cm_control_left_cover">
    <div>
        <p class="cm_interview_text">Listen post</p>
        <div class="cm_control_btns_cover">
            <button class="ds_footer_btn" type="button" id="listenPostPauseId">
               Pause
            </button>
            <button class="ds_footer_btn" type="button" id="listenPostResumeId">
               Resume
            </button>
            <button class="ds_footer_btn" type="button" id="listenPostStopId">
                Cancel
            </button>
        </div>
        <div class="cm_control_btns_cover">
        <select id="listenPostSpeedRateId" class="ds_footer_select">
        <option value='0.25' >0.25x</option>
        <option value='0.5' >0.5x</option>
        <option value='0.75' >0.75x</option>
        <option value='1.0' selected>1.0x</option>
        <option value='1.5' >1.5x</option>
        <option value='2.0' >2x</option>
        <option value='3.0' >3x</option>
    </select>
        <select id="listenPostVoiceSelectId" class="ds_footer_select cm_listen_post_voice_select">

        </select>
    </div>
    </div>
</div>`

    body.append(controlCover);

}

const attachVoices = () => {
    const voiceSelect = document?.getElementById('listenPostVoiceSelectId');

    for (const voice of voices) {
        const option = document.createElement("option");
        option.textContent = `${voice.name} (${voice.lang})`;

        if (voice.default) {
            option.textContent += " — DEFAULT";
        }

        option.setAttribute("data-lang", voice.lang);
        option.setAttribute("data-name", voice.name);
        option.value = voice.name;
        voiceSelect.append(option);
    }
}

const createDraggableControls = () => {
    appendListenControls();
    attachVoices();
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

const readPost = () => {
    const scrollContentElement = document.querySelector('.scaffold-finite-scroll__content');
    const voice = document.getElementById('listenPostVoiceSelectId');
    const readRate = document.getElementById('listenPostSpeedRateId');

    addEventListenerToVoiceChange(voice);
    addEventListenerToSpeedRateChange(readRate);

    scrollContentElement.addEventListener('click', (event) => {
        const postText = event.target.textContent;
        const dirAttribute = event.target.getAttribute('dir');

        if (postText && dirAttribute) {

            const wordMatchRegExp = /[^\s]+/g;
            const words = postText.matchAll(wordMatchRegExp);

            let postWords = [...words];
            postWords = postWords.join(' ');

            const utterance = new SpeechSynthesisUtterance(postWords);
            utterance.rate = parseFloat(readRate.value);

            const selectedVoice = voice.selectedOptions[0].getAttribute("data-name");
            for (let i = 0; i < voices.length; i++) {
                if (voices[i].name === selectedVoice) {
                    utterance.voice = voices[i];
                }
            }

            utterance.onerror = (event) => {
                // console.log('Speech synthesis error:', event.error);
            };

            tts.cancel();
            tts.speak(utterance);
            handleReadStateBtns('start');

            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    // console.log('Current position:', event.charIndex);
                }
            };

        }
        else console.log("No post content");
    });
}

const addEventListenerToVoiceChange = (voiceElement) => {
    voiceElement.addEventListener('change', () => {
        const selectedVoice = voiceElement.selectedOptions[0].getAttribute("data-name");
        for (let i = 0; i < voices.length; i++) {
            if (voices[i].name === selectedVoice) {
                tts.voice = voices[i];
                tts.cancel();
                return;
            }
        }
    });
}

const addEventListenerToSpeedRateChange = (speedRateElement) => {
    speedRateElement.addEventListener('change', (e) => {
        tts.rate = e.target.value;
        tts.cancel();
    });
}

const handleReadStateBtns = (readState) => {
    const pauseBtn = document.getElementById('listenPostPauseId');

    if (readState == 'pause') {
        pauseBtn.classList.add('cm_control_active_state');
    } else {
        pauseBtn.classList.remove('cm_control_active_state');
    }
}

const addEventListenerToPause = () => {
    document.getElementById('listenPostPauseId')?.addEventListener('click', () => {
        tts.pause();
        handleReadStateBtns('pause');
    });
}

const addEventListenerToResume = () => {
    document.getElementById('listenPostResumeId')?.addEventListener('click', () => {
        tts.resume();
        handleReadStateBtns('resume');
    });
}

const addEventListenerToStop = () => {
    document.getElementById('listenPostStopId')?.addEventListener('click', () => {
        tts.cancel();
        handleReadStateBtns('resume');
    });
}

const executeLinkedInScript = () => {


    chrome.storage.sync.get(['listenPostLinkedIn', 'autoExpandLinkedIn'], (result) => {
        console.log(result);
        if (result.autoExpandLinkedIn !== 'off') activateAutoReadMoreClick();
        if (result.listenPostLinkedIn !== 'off') {
            createDraggableControls();
            readPost();
            addEventListenerToPause();
            addEventListenerToResume();
            addEventListenerToStop();
        } else {
            const postTextWrapperElement = document.querySelectorAll('.feed-shared-update-v2__description-wrapper');
            const updateComponentElement = document.querySelectorAll('.update-components-text')

            postTextWrapperElement.forEach((element) => {
                element.addEventListener('mouseover', (e) => {
                    element.style.background = 'transparent';
                    element.style.color = '#fff';
                });
            });
        }
    });
};

executeLinkedInScript();