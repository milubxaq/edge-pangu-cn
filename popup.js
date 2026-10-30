'use strict';

const DEFAULTS = { spacing: true, punctuation: false };

const spacingEl = document.getElementById('spacing');
const punctuationEl = document.getElementById('punctuation');

chrome.storage.sync.get(DEFAULTS, (value) => {
  spacingEl.checked = !!value.spacing;
  punctuationEl.checked = !!value.punctuation;
});

function save() {
  chrome.storage.sync.set({
    spacing: spacingEl.checked,
    punctuation: punctuationEl.checked,
  });
}

spacingEl.addEventListener('change', save);
punctuationEl.addEventListener('change', save);

document.getElementById('run').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id != null) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'PANGU_FORMAT_SELECTION' });
    } catch (e) {
      // 某些页面（如浏览器内部页）不允许注入脚本
    }
  }
  window.close();
});
