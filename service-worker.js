// Imported from Google Chrome official sample: sidepanel-multiple
// Adapted to open the main tools panel by default and support direct insert
const mainPage = 'sidepanels/tools.html';

chrome.runtime.onInstalled.addListener(() => {
  // Open panel on action click and set the default panel path
  chrome.sidePanel.setOptions({ path: mainPage });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
  if (chrome.sidePanel?.setOptions) {
    chrome.sidePanel.setOptions({ path: mainPage });
  }
});

// Keep panel path aligned for each active/loaded tab
if (chrome.tabs && chrome.sidePanel?.setOptions) {
  chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.sidePanel.setOptions({ tabId, path: mainPage, enabled: true }).catch?.(() => {});
  });
  chrome.tabs.onUpdated.addListener((tabId, info) => {
    if (info.status === 'complete') {
      chrome.sidePanel.setOptions({ tabId, path: mainPage, enabled: true }).catch?.(() => {});
    }
  });
}

// Explicitly set path and open on action click (in addition to openPanelOnActionClick)
chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab?.id;
  if (!tabId) return;
  try {
    if (chrome.sidePanel?.setOptions) {
      await chrome.sidePanel.setOptions({ tabId, path: mainPage, enabled: true });
    }
    if (chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ tabId });
    }
  } catch (_) {}
});

// Route messages from the side panel to the active tab for direct insert
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return;

  if (message.action === 'insertText') {
    const text = message.text || '';
    const forwardToTab = (tabId) => {
      if (!tabId) return sendResponse({ ok: false, error: 'No active tab' });

      const sendToFrame = (frameId) => new Promise((resolve) => {
        // If frameId is undefined, message goes to the main frame
        const options = frameId !== undefined ? { frameId } : undefined;
        chrome.tabs.sendMessage(tabId, { action: 'insertText', text }, options, (response) => {
          if (chrome.runtime.lastError) {
            resolve(false);
            return;
          }
          const ok = !!(response && response.ok === true);
          resolve(ok);
        });
      });

      const trySendAllFrames = () => new Promise((resolve) => {
        if (chrome.webNavigation?.getAllFrames) {
          chrome.webNavigation.getAllFrames({ tabId }, async (frames) => {
            let anyOk = false;
            if (Array.isArray(frames) && frames.length) {
              for (const f of frames) {
                const ok = await sendToFrame(f.frameId);
                anyOk = anyOk || ok;
              }
            } else {
              anyOk = await sendToFrame(undefined);
            }
            resolve(anyOk);
          });
        } else {
          sendToFrame(undefined).then((ok) => resolve(ok));
        }
      });

      // First attempt: send to existing frames
      (async () => {
        let anyOk = await trySendAllFrames();
        if (anyOk) {
          sendResponse({ ok: true });
          return;
        }
        // Second attempt: inject content script and retry once
        try {
          await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content.js'] });
        } catch (_) {}
        anyOk = await trySendAllFrames();
        sendResponse({ ok: anyOk });
      })();
      return true; // keep channel open for async flow

    };

    if (sender.tab?.id) {
      forwardToTab(sender.tab.id);
    } else {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        forwardToTab(tabs[0]?.id);
      });
    }
    return true; // async response
  }
});
