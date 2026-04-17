function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---- Saved selection state ----
// The selection is saved BEFORE the command box opens, because clicking
// the command box moves focus away and the browser clears the selection.

let savedRange: Range | null = null;
let savedElement: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null = null;
let savedStart: number = 0;
let savedEnd: number = 0;

/** Save the current selection so it can be restored later. */
export function saveSelection(): void {
  const active = document.activeElement;

  // Save textarea/input selection
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
    savedElement = active;
    savedStart = active.selectionStart ?? 0;
    savedEnd = active.selectionEnd ?? 0;
    savedRange = null;
    return;
  }

  // Save contenteditable / general selection range
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0).cloneRange();
    if (active instanceof HTMLElement && active.isContentEditable) {
      savedElement = active;
    } else {
      // Walk up to find the nearest contenteditable parent
      let node = selection.anchorNode?.parentElement;
      while (node) {
        if (node.isContentEditable) { savedElement = node; break; }
        node = node.parentElement;
      }
    }
    savedStart = 0;
    savedEnd = 0;
  }
}

/** Restore the previously saved selection. */
function restoreSelection(): boolean {
  // Restore textarea/input
  if (savedElement instanceof HTMLTextAreaElement || savedElement instanceof HTMLInputElement) {
    savedElement.focus();
    savedElement.selectionStart = savedStart;
    savedElement.selectionEnd = savedEnd;
    return true;
  }

  // Restore contenteditable / range
  if (savedRange && savedElement) {
    savedElement.focus();
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
      return true;
    }
  }

  return false;
}

/** Get the currently selected text in the page. */
export function getSelectedText(): string {
  const selection = window.getSelection();
  return selection?.toString().trim() || '';
}

/** Get the bounding rect of the current selection. */
export function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return range.getBoundingClientRect();
}

/** Replace the saved selection with new text. */
export function replaceSelection(newText: string): boolean {
  // Restore the saved selection first
  if (!restoreSelection()) {
    // Last resort: try clipboard
    navigator.clipboard.writeText(newText);
    return false;
  }

  // Handle textarea/input
  if (savedElement instanceof HTMLTextAreaElement || savedElement instanceof HTMLInputElement) {
    const el = savedElement;
    const value = el.value;
    el.value = value.slice(0, savedStart) + newText + value.slice(savedEnd);

    const newPos = savedStart + newText.length;
    el.selectionStart = newPos;
    el.selectionEnd = newPos;

    // Fire events for framework compatibility (React, Angular, etc.)
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    clearSaved();
    return true;
  }

  // Handle contenteditable — use execCommand to preserve font/size/formatting
  if (savedRange) {
    const selection = window.getSelection();
    if (!selection) { clearSaved(); return false; }

    // Restore the selection range
    selection.removeAllRanges();
    selection.addRange(savedRange);

    // Convert plain text to HTML that preserves the editor's formatting:
    // - escapeHtml prevents XSS
    // - \n\n → <br><br> (paragraph break)
    // - \n → <br> (line break)
    // insertHTML inherits font/size/color from the surrounding content
    const html = escapeHtml(newText).replace(/\n/g, '<br>');
    const success = document.execCommand('insertHTML', false, html);

    if (!success) {
      // Fallback to insertText
      document.execCommand('insertText', false, newText);
    }

    savedElement?.dispatchEvent(new Event('input', { bubbles: true }));
    clearSaved();
    return true;
  }

  clearSaved();
  return false;
}

/** Insert text below the saved selection. */
export function insertBelowSelection(newText: string): boolean {
  if (!restoreSelection()) {
    navigator.clipboard.writeText(newText);
    return false;
  }

  if (savedElement instanceof HTMLTextAreaElement || savedElement instanceof HTMLInputElement) {
    const el = savedElement;
    const insertion = '\n\n' + newText;
    el.value = el.value.slice(0, savedEnd) + insertion + el.value.slice(savedEnd);

    const newPos = savedEnd + insertion.length;
    el.selectionStart = newPos;
    el.selectionEnd = newPos;

    el.dispatchEvent(new Event('input', { bubbles: true }));
    clearSaved();
    return true;
  }

  if (savedRange) {
    const selection = window.getSelection();
    if (!selection) { clearSaved(); return false; }

    savedRange.collapse(false);
    const br = document.createElement('br');
    const br2 = document.createElement('br');
    const textNode = document.createTextNode(newText);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(br);
    fragment.appendChild(br2);
    fragment.appendChild(textNode);
    savedRange.insertNode(fragment);

    savedRange.setStartAfter(textNode);
    savedRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(savedRange);

    savedElement?.dispatchEvent(new Event('input', { bubbles: true }));
    clearSaved();
    return true;
  }

  clearSaved();
  return false;
}

function clearSaved() {
  savedRange = null;
  savedElement = null;
  savedStart = 0;
  savedEnd = 0;
}
