
chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {
        // todo before sending out the message, make sure that the  url is github's
        if (changeInfo.url != null) {
            chrome.tabs.sendMessage(tabId, {
                message: 'urlUpdate',
                url: changeInfo.url
            })
        }
    }
);