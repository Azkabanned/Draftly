/**
 * Real-time inline grammar/spelling underlines.
 * Analyses text as you type and renders wavy underlines under errors.
 */

interface GrammarError {
  start: number;
  end: number;
  type: 'spelling' | 'grammar' | 'style' | 'clarity';
  message: string;
  suggestion: string;
}

const DEBOUNCE_MS = 1200; // Wait 1.2s after last keystroke
const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 3000;
const COLORS: Record<string, string> = {
  spelling: '#ef4444',  // red
  grammar: '#ef4444',   // red
  style: '#3b82f6',     // blue
  clarity: '#f59e0b',   // amber
};

let activeElement: HTMLElement | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastAnalysedHash = '';
let currentErrors: GrammarError[] = [];
let overlayContainer: HTMLDivElement | null = null;
let tooltipEl: HTMLDivElement | null = null;
let enabled = false;

export function initGrammarChecker() {
  // Check if grammar checking is enabled in settings
  chrome.runtime.sendMessage({ type: 'LOAD_SETTINGS' }, (resp) => {
    // Grammar checking defaults to enabled — can be toggled in settings later
    enabled = true;
    if (enabled) startListening();
  });
}

function startListening() {
  document.addEventListener('focusin', handleFocusIn, true);
  document.addEventListener('focusout', handleFocusOut, true);
  document.addEventListener('input', handleInput, true);
}

function handleFocusIn(e: FocusEvent) {
  const el = e.target as HTMLElement;
  if (!isEditableElement(el)) return;
  activeElement = el;
  // Analyse existing content on focus
  scheduleAnalysis();
}

function handleFocusOut(e: FocusEvent) {
  // Small delay to avoid removing underlines during click on tooltip
  setTimeout(() => {
    if (document.activeElement !== activeElement) {
      clearOverlays();
      activeElement = null;
      lastAnalysedHash = '';
    }
  }, 200);
}

function handleInput(e: Event) {
  const el = e.target as HTMLElement;
  if (el !== activeElement || !isEditableElement(el)) return;
  scheduleAnalysis();
}

function isEditableElement(el: HTMLElement): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement && el.type === 'text') return true;
  if (el.isContentEditable) return true;
  return false;
}

function getElementText(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return el.innerText || '';
}

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return String(hash);
}

function scheduleAnalysis() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => analyse(), DEBOUNCE_MS);
}

async function analyse() {
  if (!activeElement || !enabled) return;
  const text = getElementText(activeElement);
  if (text.length < MIN_TEXT_LENGTH) { clearOverlays(); return; }

  const hash = simpleHash(text);
  if (hash === lastAnalysedHash) return; // No change
  lastAnalysedHash = hash;

  const truncated = text.slice(0, MAX_TEXT_LENGTH);

  try {
    const response = await new Promise<any>((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'ANALYZE_GRAMMAR', text: truncated },
        (resp) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(resp);
        },
      );
    });

    if (response?.errors && Array.isArray(response.errors)) {
      currentErrors = response.errors;
      renderUnderlines();
    }
  } catch (err) {
    console.warn('[Draftly Grammar] Analysis failed:', err);
  }
}

// ---- Rendering ----

function renderUnderlines() {
  clearOverlays();
  if (!activeElement || currentErrors.length === 0) return;

  if (activeElement.isContentEditable) {
    renderContentEditableUnderlines();
  } else if (activeElement instanceof HTMLTextAreaElement) {
    renderTextareaUnderlines();
  }
}

function renderContentEditableUnderlines() {
  const el = activeElement!;
  const text = el.innerText || '';

  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.className = 'draftly-grammar-overlay';
  overlayContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; pointer-events: none; z-index: 2147483640;';
  document.body.appendChild(overlayContainer);

  for (const error of currentErrors) {
    if (error.start < 0 || error.end > text.length || error.start >= error.end) continue;

    // Find the text node and create a range
    const range = findRangeForOffset(el, error.start, error.end);
    if (!range) continue;

    try {
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        createUnderlineElement(rect, error);
      }
    } catch {}
  }
}

function renderTextareaUnderlines() {
  // For textareas, use a mirror div to calculate positions
  const textarea = activeElement as HTMLTextAreaElement;
  const text = textarea.value;

  // Create mirror
  const mirror = document.createElement('div');
  const computed = getComputedStyle(textarea);
  const mirrorStyles = [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'letter-spacing', 'word-spacing', 'line-height', 'padding-top',
    'padding-right', 'padding-bottom', 'padding-left', 'border-width',
    'width', 'white-space', 'word-wrap', 'overflow-wrap',
  ];
  mirror.style.cssText = 'position: absolute; visibility: hidden; white-space: pre-wrap; word-wrap: break-word;';
  for (const prop of mirrorStyles) {
    mirror.style.setProperty(prop, computed.getPropertyValue(prop));
  }

  overlayContainer = document.createElement('div');
  overlayContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; pointer-events: none; z-index: 2147483640;';
  document.body.appendChild(overlayContainer);

  for (const error of currentErrors) {
    if (error.start < 0 || error.end > text.length) continue;

    // Build mirror content with a marker span
    mirror.innerHTML = '';
    mirror.appendChild(document.createTextNode(text.slice(0, error.start)));
    const marker = document.createElement('span');
    marker.textContent = text.slice(error.start, error.end);
    mirror.appendChild(marker);
    mirror.appendChild(document.createTextNode(text.slice(error.end)));

    document.body.appendChild(mirror);
    const textareaRect = textarea.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    const relX = markerRect.left - mirrorRect.left;
    const relY = markerRect.top - mirrorRect.top - textarea.scrollTop;

    const underlineRect = {
      left: textareaRect.left + relX + parseFloat(computed.paddingLeft || '0'),
      top: textareaRect.top + relY + parseFloat(computed.paddingTop || '0') + markerRect.height,
      width: markerRect.width,
      height: 2,
    };

    document.body.removeChild(mirror);
    createUnderlineElement(underlineRect as DOMRect, error);
  }
}

function createUnderlineElement(rect: DOMRect | { left: number; top: number; width: number; height: number }, error: GrammarError) {
  if (!overlayContainer) return;

  const underline = document.createElement('div');
  const color = COLORS[error.type] || COLORS.grammar;
  underline.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${('bottom' in rect ? rect.bottom : rect.top)}px;
    width: ${rect.width}px;
    height: 3px;
    pointer-events: auto;
    cursor: pointer;
    background: repeating-linear-gradient(
      90deg,
      ${color} 0px, ${color} 2px,
      transparent 2px, transparent 4px
    );
    opacity: 0.8;
    z-index: 2147483641;
  `;

  underline.addEventListener('mouseenter', (e) => showTooltip(e, error));
  underline.addEventListener('mouseleave', hideTooltip);
  underline.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyFix(error);
  });

  overlayContainer.appendChild(underline);
}

// ---- Tooltip ----

function showTooltip(e: MouseEvent, error: GrammarError) {
  hideTooltip();
  tooltipEl = document.createElement('div');
  const color = COLORS[error.type] || COLORS.grammar;
  tooltipEl.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY - 40}px;
    z-index: 2147483647;
    background: #1f2937;
    color: #f9fafb;
    font-family: Inter, system-ui, sans-serif;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 280px;
    pointer-events: auto;
    line-height: 1.4;
    border-left: 3px solid ${color};
  `;

  const msgSpan = document.createElement('span');
  msgSpan.textContent = error.message;
  tooltipEl.appendChild(msgSpan);

  if (error.suggestion) {
    const fixBtn = document.createElement('button');
    fixBtn.textContent = `Fix: ${error.suggestion}`;
    fixBtn.style.cssText = `
      display: block;
      margin-top: 4px;
      padding: 3px 8px;
      border-radius: 4px;
      border: none;
      background: ${color};
      color: white;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    `;
    fixBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyFix(error);
      hideTooltip();
    });
    tooltipEl.appendChild(fixBtn);
  }

  document.body.appendChild(tooltipEl);
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}

// ---- Fix application ----

function applyFix(error: GrammarError) {
  if (!activeElement) return;

  if (activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLInputElement) {
    const el = activeElement;
    el.focus();
    el.selectionStart = error.start;
    el.selectionEnd = error.end;
    document.execCommand('insertText', false, error.suggestion);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (activeElement.isContentEditable) {
    const range = findRangeForOffset(activeElement, error.start, error.end);
    if (range) {
      activeElement.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('insertText', false, error.suggestion);
      }
    }
  }

  // Re-analyse after fix
  scheduleAnalysis();
}

// ---- DOM helpers ----

function findRangeForOffset(root: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.textContent?.length || 0;

    if (!startNode && offset + len > start) {
      startNode = node;
      startOffset = start - offset;
    }
    if (!endNode && offset + len >= end) {
      endNode = node;
      endOffset = end - offset;
      break;
    }
    offset += len;
  }

  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  } catch {
    return null;
  }
}

function clearOverlays() {
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
  hideTooltip();
  currentErrors = [];
}
