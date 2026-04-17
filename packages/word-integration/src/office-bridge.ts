/**
 * Office.js Bridge — scaffold for future native Word add-in support.
 *
 * This module will be the integration point for Office.js APIs when building
 * a dedicated Word add-in. For now it provides the interface and stubs.
 *
 * Implementation plan:
 * 1. Create an Office Add-in manifest (manifest.xml)
 * 2. Set up a taskpane that embeds the Draftly command box UI
 * 3. Use Office.js Word APIs for selection, replacement, and formatting
 * 4. The core provider logic and prompt templates are shared with the extension
 */

import type { WordAdapter, WordTextRange } from './word-adapter';

/**
 * Bridge class for Office.js Word API integration.
 * Currently a scaffold — implement when building the native add-in.
 */
export class OfficeBridge implements WordAdapter {
  private context: any = null; // Will be Word.RequestContext

  isWordContext(): boolean {
    // In a native add-in, Office.js is always available
    return typeof Office !== 'undefined';
  }

  async getSelection(): Promise<WordTextRange | null> {
    // Scaffold — will use:
    // const context = await Word.run(async (ctx) => {
    //   const range = ctx.document.getSelection();
    //   range.load('text');
    //   await ctx.sync();
    //   return { text: range.text, start: 0, end: range.text.length };
    // });
    throw new Error('Office.js bridge not yet implemented. Use WordOnlineAdapter for browser-based Word support.');
  }

  async replaceSelection(newText: string): Promise<boolean> {
    // Scaffold — will use:
    // await Word.run(async (ctx) => {
    //   const range = ctx.document.getSelection();
    //   range.insertText(newText, Word.InsertLocation.replace);
    //   await ctx.sync();
    // });
    throw new Error('Office.js bridge not yet implemented.');
  }

  async insertAfterSelection(text: string): Promise<boolean> {
    // Scaffold — will use:
    // await Word.run(async (ctx) => {
    //   const range = ctx.document.getSelection();
    //   range.insertText('\n\n' + text, Word.InsertLocation.after);
    //   await ctx.sync();
    // });
    throw new Error('Office.js bridge not yet implemented.');
  }
}

// Declare Office global for TypeScript
declare const Office: any;
