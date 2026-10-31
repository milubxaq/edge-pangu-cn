'use strict';

(function () {
  const DEFAULTS = { spacing: true, punctuation: false };
  let settings = { ...DEFAULTS };

  chrome.storage.sync.get(DEFAULTS, (value) => {
    settings = { ...DEFAULTS, ...value };
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const key of Object.keys(changes)) {
      settings[key] = changes[key].newValue;
    }
  });

  function isEditable(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'url', 'email'].includes(type);
    }
    return el.isContentEditable;
  }

  function replaceInField(el, formatted, start, end) {
    el.setRangeText(formatted, start, end, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** 文本框/输入框的选区无法通过 window.getSelection() 读取，必须用 selectionStart/selectionEnd */
  function getFieldSelection() {
    const el = document.activeElement;
    if (!el) return null;
    const isField = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && isEditable(el));
    if (!isField || el.disabled || el.readOnly) return null;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (typeof start !== 'number' || typeof end !== 'number' || start === end) return null;
    return { el, start, end, text: el.value.slice(start, end) };
  }

  function copyText(text) {
    try {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    } catch (e) {
      // 忽略复制失败
    }
  }

  function toast(message) {
    let el = document.getElementById('pangu-cn-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pangu-cn-toast';
      el.style.cssText = [
        'position:fixed',
        'left:50%',
        'bottom:32px',
        'transform:translateX(-50%)',
        'background:rgba(17,24,39,.92)',
        'color:#fff',
        'padding:10px 16px',
        'border-radius:10px',
        'font-size:14px',
        'font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif',
        'z-index:2147483647',
        'box-shadow:0 8px 24px rgba(0,0,0,.25)',
        'pointer-events:none',
        'transition:opacity .2s',
      ].join(';');
      document.documentElement.appendChild(el);
    }
    el.textContent = message;
    el.style.opacity = '1';
    clearTimeout(el.__timer);
    el.__timer = setTimeout(() => {
      el.style.opacity = '0';
    }, 1800);
  }

  function formatSelection() {
    const field = getFieldSelection();
    const active = document.activeElement;
    const domSelection = window.getSelection();
    const raw = field ? field.text : domSelection ? domSelection.toString() : '';
    if (!raw || !raw.trim()) {
      toast('请先选中需要整理的文字');
      return;
    }

    const formatted = window.PanguCn.formatText(raw, settings);
    if (formatted === raw) {
      toast('排版已经很规整，无需修改');
      return;
    }

    if (field) {
      replaceInField(field.el, formatted, field.start, field.end);
      toast('已整理选中文字');
      return;
    }

    if (active && active.isContentEditable && domSelection && domSelection.rangeCount > 0) {
      document.execCommand('insertText', false, formatted);
      toast('已整理选中文字');
      return;
    }

    copyText(formatted);
    toast('当前区域不可编辑，已复制整理后的文字');
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== 'PANGU_FORMAT_SELECTION') return;
    formatSelection();
    sendResponse({ ok: true });
  });
})();
