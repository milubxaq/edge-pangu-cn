'use strict';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'pangu-format-selection',
    title: '中文排版：整理选中文字',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'pangu-format-selection' || !tab || tab.id == null) return;
  chrome.tabs.sendMessage(tab.id, { type: 'PANGU_FORMAT_SELECTION' }).catch(() => {});
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'format-selection') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'PANGU_FORMAT_SELECTION' }).catch(() => {});
  }
});
