/**
 * Controls the tab system in the repo, including:
 * - track open tabs
 * - track current active tab
 * - create new tab
 * - close tab
*/

import { loadFile } from './tree.js'

const TABS_MENU_ID = 'E45rt66t_Tabs'

const tabsMenuRoot = document.createElement('div')
tabsMenuRoot.id = TABS_MENU_ID
tabsMenuRoot.classList.add('topnav')


const openTabsIds = []
let activeTab = null

const _getFilePathFromId = (tabId) => {
    return tabId.split('tab_id_')[1]
}

const _injectTabsMenu = () => {
    if (document.getElementById(TABS_MENU_ID) != null) {
        return
    }
    const mainTag = document.getElementById('js-repo-pjax-container')
    if (mainTag == null) {
        console.error('failed to find node to insert tabs')
        // TODO: insert tabs as 1st child of the main tag
        return
    }
    mainTag.insertBefore(tabsMenuRoot, mainTag.firstChild)
}

const _closeTab = (tabId) => {
    // TODO if its last tab we're closing redirect to repo root page
    const indToRemove = openTabsIds.indexOf(tabId)
    if (indToRemove < 0) {
        return
    }
    openTabsIds.splice(indToRemove, 1)
    const tab = document.getElementById(tabId)
    tabsMenuRoot.removeChild(tab)


    if (tabId === activeTab.getAttribute('tabId')) {
        const nextEleInd = indToRemove === 0 ? indToRemove : indToRemove - 1
        const newActiveId = openTabsIds[nextEleInd % openTabsIds.length]
        activeTab = document.getElementById(newActiveId)
        activeTab.classList.toggle('active_tab')
        loadFile(
            activeTab.getAttribute('fileUrl'),
            activeTab.getAttribute('fileName'),
            _getFilePathFromId(activeTab.getAttribute('tabId'))
        )
    }
}

const _onTabClose = (event) => {
    _closeTab(event.target.parentElement.getAttribute('tabId'))
}

const _onTabClick = (event) => {
    const clicked = event.target
    // clicking closed tab since the event propagated from the X to the parent div
    if (openTabsIds.indexOf(clicked.getAttribute('tabId')) < 0
        && openTabsIds.indexOf(clicked.parentElement.getAttribute('tabId')) < 0) {
        return
    }
    const tabId = clicked.getAttribute('tabId')
    if (tabId === activeTab.getAttribute('tabId')) {
        return
    }
    clicked.classList.toggle('active_tab')
    activeTab.classList.toggle('active_tab')
    activeTab = clicked

    const newFileUrl = clicked.getAttribute('fileUrl')
    const fileName = clicked.getAttribute('fileName')
    loadFile(
        newFileUrl, 
        fileName, 
        _getFilePathFromId(clicked.getAttribute('tabId'))
    )
}

const createNewTab = (tab) => {
    if (tab == null || openTabsIds.indexOf(tab.id) >= 0) {
        return
    }
    const tabId = tab.id
    const tabEle = document.createElement('div')
    tabEle.classList.add('tab')
    tabEle.onclick = _onTabClick
    tabEle.classList.toggle('active_tab')
    tabEle.textContent = tab.fileName
    tabEle.setAttribute('tabId', tabId)
    tabEle.setAttribute('fileUrl', tab.fileUrl)
    tabEle.setAttribute('fileName', tab.fileName)
    tabEle.id = tabId

    const closeEle = document.createElement('a')
    closeEle.textContent = 'X'
    closeEle.style.marginLeft = '20px'
    closeEle.onclick = _onTabClose

    tabEle.appendChild(closeEle)

    activeTab != null && activeTab.classList.toggle('active_tab')
    activeTab = tabEle
    openTabsIds.push(tabId)
    tabsMenuRoot.appendChild(tabEle)
}

const makeTabActive = (tab) => {
    _injectTabsMenu()
    if (tab == null || openTabsIds.indexOf(tab.id) < 0) {
        createNewTab(tab)
        return
    } else if (tab.id === activeTab.getAttribute('tabId')) {
        return
    }

    activeTab.classList.toggle('active_tab')
    const newActive = document.getElementById(tab.id)
    newActive.classList.toggle('active_tab')
    activeTab = newActive
}

export { makeTabActive }

