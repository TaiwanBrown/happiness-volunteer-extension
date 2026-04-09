// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === 'insertText') {
    const ok = insertAtCursor(request.text || '');
    try { sendResponse({ ok }); } catch {}
  }
});

// Helper: insert text at cursor for inputs/textareas and contentEditable
function insertAtCursor(text) {
  const el = document.activeElement;
  if (!el) return false;

  const tag = el.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
  const isCE = el.isContentEditable === true;

  if (isInput) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    const pos = start + text.length;
    try { el.setSelectionRange(pos, pos); } catch {}
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  if (isCE) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    // Ensure selection is within the active contentEditable element
    let container = range.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) container = container.parentNode;
    if (!el.contains(container)) {
      // Move caret to end of contentEditable
      range.selectNodeContents(el);
      range.collapse(false);
    }
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    // Move caret to end of inserted text
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  }

  return false;
}
