// main entry point
'use strict';

const script = document.createElement('script');
script.setAttribute("type", "module");
script.setAttribute("src", chrome.extension.getURL('main.js'));

const head =
    document.head
    || document.getElementsByTagName("head")[0] || document.documentElement

head.insertBefore(script, head.lastChild);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message === 'urlUpdate') {
          const newUrl = request.url
          window.postMessage({url: newUrl}, '*')
      }
  });

