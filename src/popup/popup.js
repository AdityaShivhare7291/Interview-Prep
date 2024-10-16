const urlType = { DEV: 'DEV', PROD: 'PROD' };
const menuTab = { TOOLS: 'Tools', COMPANIES: 'Companies' };
const contextType = { INTERVIEW: "INTERVIEW", COMPANY: "COMPANY" };
const ENV_TYPE = urlType.PROD;
const BASE_URL = (
    ENV_TYPE === urlType.DEV ?
        'http://localhost:5000/api/v1' :
        'https://careermatrix.vercel.app/api/v1'
);

document.addEventListener('DOMContentLoaded', () => {

    const companyList = document.getElementById('companyListId');
    const interviewExpList = document.getElementById('interviewExpListId');
    const openSelectedBtn = document.getElementById('openSelectBtnId');

    const searchCompanyInput = document.getElementById('searchCompanyInputId');
    const searchInterviewsInput = document.getElementById('searchInterviewExpInputId');

    let selectedCompanies = [];

    let activeMenuTab = menuTab.COMPANIES;

    const displayLoading = () => {
        const showLoading = `
        <div class="spinner_card">
            <div class="spinner" ></div>
        </div>
        `;

        interviewExpList.innerHTML = showLoading;
    }

    const displayError = () => {
        const error = `
        <div class="error_card">
            <h3 class="error_text">Something went wrong!</h3>
        </div>
        `;
        interviewExpList.innerHTML = error;
    }

    const getNotFoundMessage = (type = contextType.COMPANY) => {
        let notFoundCard = `
        <div class="not_found_card">
            <h3 class="not_found_card_text" >
                ${type === contextType.INTERVIEW ?
                "No interview experiences found? No worries! The best stories often begin with a blank page." :
                "Zero results? Don't worry, the right company is waiting for you."
            }
            </h3>
        </div>
        `;

        if (type === contextType.INTERVIEW) interviewExpList.innerHTML = notFoundCard;
        else companyList.innerHTML = notFoundCard;
    }

    const highlightSelectedCompanies = () => {
        const companiesElement = document.querySelectorAll('.company_name');
        companiesElement.forEach(company => {
            const companyCareerPageLink = company.getAttribute('data-careerPageLink');
            const companyCareerIndex = selectedCompanies.indexOf(companyCareerPageLink);
            if (companyCareerIndex != -1) {
                const companyCard = company.closest('.company_card_item')
                companyCard.classList.toggle('selected');
                const checkmarkCircle = companyCard.querySelector('.company_checkmark_circle');
                checkmarkCircle.classList.toggle('selected_company');
            }
        });
    }

    const filterListData = (searchQuery, listData, type = contextType.COMPANY) => {
        (type === contextType.INTERVIEW ? interviewExpList : companyList).innerHTML = "";

        const filteredListData = listData.filter(listItem => {
            const listItemTitle = (
                type === contextType.INTERVIEW ?
                    listItem.title + " | " + listItem.company :
                    listItem.companyName
            );
            return listItemTitle.toLowerCase().includes(searchQuery.toLowerCase());
        });

        if (filteredListData.length > 0) {
            getAllListCard(filteredListData, type);
            addEventListenerToListItemCard(filteredListData, type);
            type === contextType.COMPANY && highlightSelectedCompanies();
        } else {
            getNotFoundMessage(type);
        }
    }

    const getSearchData = (listData, type = contextType.COMPANY) => {
        if (type === contextType.INTERVIEW) {
            searchInterviewsInput.addEventListener('input', () => {
                const searchInterviewsText = searchInterviewsInput.value;
                filterListData(searchInterviewsText, listData, type);
            });
        } else {
            searchCompanyInput.addEventListener('input', () => {
                const searchCompanyText = searchCompanyInput.value;
                filterListData(searchCompanyText, listData);
            });
        }
    }

    const getCompanyListItemCard = (cardItem, type) => {
        const card = {
            COMPANY: `
            <div class="card_item company_card_item">
                <div class="card_item_content company_card_item_content">
                <span class="card_checkmark_circle company_checkmark_circle"></span>
                <p class="card_title company_name" data-careerPageLink="${cardItem.careerPageLink}" >${cardItem.companyName}</p>
                </div>
            </div>`,
            INTERVIEW: `
            <div class="card_item interview_card_item">
                <div class="card_item_content interview_card_item_content">
                <p class="card_title interview_card_title" data-careerPageLink="${cardItem.link}" >${cardItem.title} | ${cardItem.company}</p>
                </div>
            </div>`
        }

        return card[type];
    };

    const addEventListenerToListItemCard = (cardData, type = contextType.COMPANY) => {
        const companiesElement = document.querySelectorAll('.company_name');
        const interviewsElement = document.querySelectorAll('.interview_card_title');

        (type === contextType.INTERVIEW ? interviewsElement : companiesElement).forEach((cardItem, cardIndex) => {
            cardItem.addEventListener('click', async (e) => {
                e.preventDefault();

                try {
                    const openLinkModeObj = await chrome.storage.sync.get({ openLinkMode: 'Normal' });
                    const openLinkMode = openLinkModeObj.openLinkMode;
                    const isIncognito = openLinkMode.includes('incognito');

                    const cardItemObj = cardData[cardIndex];
                    const link = (
                        type === contextType.INTERVIEW ? cardItemObj.link : cardItemObj.careerPageLink
                    );

                    link ?
                        isIncognito ?
                            chrome.windows.create({
                                url: link,
                                incognito: isIncognito
                            }) :
                            chrome.tabs.create({
                                url: link,
                                active: false,
                            }) :
                        alert("No career page found");

                } catch (err) {
                    console.log(err);
                }
            });
        });
    }

    const addEventListenerToCompanyCheckmark = () => {
        companyList.addEventListener('click', function (e) {
            if (e.target && e.target.matches('.company_checkmark_circle')) {
                const span = e.target;
                span.classList.toggle('selected_company');

                const companyCard = span.closest('.company_card_item');
                companyCard.classList.toggle('selected');

                const company = companyCard.querySelector('.company_name');
                const companyCareerPageLink = company.getAttribute('data-careerPageLink');
                const companyCareerIndex = selectedCompanies.indexOf(companyCareerPageLink);
                if (companyCareerIndex == -1)
                    selectedCompanies.push(companyCareerPageLink);
                else
                    selectedCompanies.splice(companyCareerIndex, 1);

                openSelectedBtn.textContent = `Open (${selectedCompanies.length})`;
            }
        });
    }

    const addEventListenerToOpenBtn = () => {
        openSelectedBtn.addEventListener('click', async () => {

            const openLinkModeObj = await chrome.storage.sync.get({ openLinkMode: 'Normal' });
            const openLinkMode = openLinkModeObj.openLinkMode;
            const isIncognito = openLinkMode.includes('incognito');

            if (isIncognito) {
                await chrome.windows.create({
                    incognito: true,
                    url: selectedCompanies
                },
                    () => {
                        selectedCompanies = [];
                        resetCompanySelection();
                    }
                );
            } else {
                selectedCompanies.forEach((careerPageLink) => {
                    careerPageLink && chrome.tabs.create({ url: careerPageLink, active: false });
                });
                selectedCompanies = [];
                resetCompanySelection();
            }

        });
    }

    const resetCompanySelection = () => {
        const selectedCompaniesElement = document.querySelectorAll('.selected_company');

        selectedCompaniesElement.forEach((company) => {
            const companyCard = company.closest('.company_card_item');
            companyCard.classList.remove('selected');
            company.classList.remove('selected_company');
        });

        selectedCompanies = [];
        openSelectedBtn.textContent = `Open (0)`;
    }

    const addEventListenerToResetBtn = () => {
        const resetButton = document.getElementById('resetBtnId');
        resetButton.addEventListener('click', () => {
            resetCompanySelection();
        });
    }

    const getAllListCard = (data, type = contextType.COMPANY) => {
        let list = "";

        data.forEach((dataItem) => {
            if (dataItem.companyName || dataItem.title) {
                let listItemCard = getCompanyListItemCard(dataItem, type);
                list += listItemCard;
            }
        });

        if (type === contextType.INTERVIEW)
            interviewExpList.innerHTML = list;
        else
            companyList.innerHTML = list;
    }

    const addEventListenerToMenu = () => {
        const menuContainer = document.querySelector('.menu_tab_cover');

        menuContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('menu_tab_btn')) {
                const menuTabName = event.target.getAttribute('data-menuTabName');

                activeMenuTab = menuTab[menuTabName.toLocaleUpperCase()];

                if (activeMenuTab == menuTab.TOOLS) {
                    const companiesTabSection = document.querySelectorAll('.cm_companies_section');
                    const dashboardTabSection = document.querySelectorAll('.cm_dashboard_section');

                    companiesTabSection.forEach(element => {
                        element.classList.remove('active_section');
                    });

                    dashboardTabSection.forEach(element => {
                        element.classList.add('active_section');
                    });
                } else {
                    const companiesTabSection = document.querySelectorAll('.cm_companies_section');
                    const dashboardTabSection = document.querySelectorAll('.cm_dashboard_section');

                    dashboardTabSection.forEach(element => {
                        element.classList.remove('active_section');
                    });

                    companiesTabSection.forEach(element => {
                        element.classList.add('active_section');
                    });
                }

                menuContainer.querySelectorAll('.menu_tab_btn').forEach(menuTab => {
                    menuTab.classList.remove('active_menu_tab_btn');
                });

                event.target.classList.toggle('active_menu_tab_btn');
            }
        });
    }

    const addEventListenerToSettings = () => {
        const cSettingsBtn = document.getElementById('cSettingsBtnId');
        const tSettingsBtn = document.getElementById('tSettingsBtnId');

        cSettingsBtn.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options/options.html'));
            }
        });

        tSettingsBtn.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options/options.html'));
            }
        });
    }

    const addEventListenerToBuyMeCoffee = () => {
        const buyCoffeeBtn = document.querySelector('.cm_buymeacoffee_btn');
        buyCoffeeBtn.addEventListener('click', () => {
            chrome.tabs.create({
                url: `https://www.buymeacoffee.com/abhishekmaran`,
                active: true
            });
        });
    }

    const renderAllCompanies = () => {

        fetch('./../data/companies.json')
            .then((response) => { return response.json() })
            .then((companies) => {
                getAllListCard(companies);
                addEventListenerToListItemCard(companies);
                addEventListenerToCompanyCheckmark();
                addEventListenerToResetBtn();
                addEventListenerToOpenBtn();
                getSearchData(companies);
                addEventListenerToMenu();
                addEventListenerToSettings();
                addEventListenerToBuyMeCoffee();
            })
            .catch((error) => console.log(error));
    }

    const renderAllInterviewExperiences = () => {

        displayLoading();

        fetch(`${BASE_URL}/interview/all`)
            .then((response) => { return response.json() })
            .then((interviewExperiences) => {

                if (interviewExperiences?.data?.length > 0) {
                    const interviewExperiencesData = interviewExperiences?.data
                    getAllListCard(interviewExperiencesData, contextType.INTERVIEW);
                    addEventListenerToListItemCard(interviewExperiencesData, contextType.INTERVIEW);
                    getSearchData(interviewExperiencesData, contextType.INTERVIEW);
                } else {
                    getNotFoundMessage(contextType.INTERVIEW);
                }

            })
            .catch((error) => {
                console.log(error);
                displayError();
            });
    }

    renderAllCompanies();
    renderAllInterviewExperiences();

});

const recentRead = document.querySelector('.recent_read_url');

chrome.storage.sync.get(['recentReadUrl'], (result) => {
    recentRead.textContent = result?.recentReadUrl ? result.recentReadUrl : `Nothing's here`;
});

recentRead.addEventListener('click', (e) => {
    const recentReadUrl = e.target.textContent;
    recentReadUrl.startsWith('https://') && chrome.tabs.create({ url: recentReadUrl, active: false });
});



