/**
 * Abstraction layer for Word text operations.
 * Phase 1: works with Word Online via content script (browser DOM).
 * Phase 2: implement using Office.js APIs for native Word add-in.
 */

export interface WordTextRange {
  text: string;
  start: number;
  end: number;
}

export interface WordAdapter {
  /** Get the currently selected text in the Word document. */
  getSelection(): Promise<WordTextRange | null>;

  /** Replace the current selection with new text. */
  replaceSelection(newText: string): Promise<boolean>;

  /** Insert text after the current selection. */
  insertAfterSelection(text: string): Promise<boolean>;

  /** Check if we're in a Word document context. */
  isWordContext(): boolean;
}

/**
 * Word Online adapter — works through the browser DOM.
 * Word Online uses contenteditable divs, which the Chrome extension
 * content script can interact with using the standard selection API.
 */
export class WordOnlineAdapter implements WordAdapter {
  isWordContext(): boolean {
    const url = window.location.href;
    return (
      url.includes('word-edit.officeapps.live.com') ||
      url.includes('word.cloud.microsoft') ||
      url.includes('onedrive.live.com') ||
      url.includes('.sharepoint.com')
    );
  }

  async getSelection(): Promise<WordTextRange | null> {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return null;

    const text = selection.toString().trim();
    if (!text) return null;

    const range = selection.getRangeAt(0);
    return {
      text,
      start: 0, // Precise offset tracking requires deeper DOM analysis
      end: text.length,
    };
  }

  async replaceSelection(newText: string): Promise<boolean> {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    // Word Online uses contenteditable, so execCommand works
    document.execCommand('insertText', false, newText);
    return true;
  }

  async insertAfterSelection(text: string): Promise<boolean> {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    range.collapse(false);

    const textNode = document.createTextNode('\n\n' + text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    return true;
  }
}

/**
 * Detect if current page is Word Online and return the appropriate adapter.
 */
export function createWordAdapter(): WordAdapter | null {
  const adapter = new WordOnlineAdapter();
  return adapter.isWordContext() ? adapter : null;
}
