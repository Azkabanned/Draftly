import type { TabContext, PrivacySettings } from '@draftly/shared';
import { extractTextFromHtml, truncateToTokens } from '@draftly/shared';
import { filterSensitiveTabs } from '../privacy/sensitive';

const MAX_CONTENT_LENGTH = 5000; // chars per tab

export interface TabInfo {
  tabId: number;
  title: string;
  url: string;
}

/**
 * Gather context from open Chrome tabs.
 * Only runs inside the extension's service worker.
 */
export async function gatherTabContexts(
  settings: PrivacySettings,
  selectedTabIds?: number[],
): Promise<TabContext[]> {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    return [];
  }

  // Get all tabs or specific ones
  const allTabs = await chrome.tabs.query({ currentWindow: true });
  let tabs = allTabs.filter((t) => t.id !== undefined && t.url && t.title);

  // If specific tabs are selected, filter to those
  if (selectedTabIds && selectedTabIds.length > 0) {
    tabs = tabs.filter((t) => selectedTabIds.includes(t.id!));
  }

  // Build tab info for sensitivity filtering
  const tabInfos: (TabInfo & { url: string })[] = tabs.map((t) => ({
    tabId: t.id!,
    title: t.title || '',
    url: t.url || '',
  }));

  // Filter out sensitive tabs
  const { allowed } = filterSensitiveTabs(tabInfos, settings);

  // Extract content from allowed tabs
  const contexts: TabContext[] = [];
  for (const tab of allowed) {
    try {
      const content = await extractTabContent(tab.tabId);
      if (content) {
        contexts.push({
          tabId: tab.tabId,
          title: tab.title,
          url: tab.url,
          content: truncateToTokens(content, MAX_CONTENT_LENGTH / 4),
        });
      }
    } catch {
      // Skip tabs we can't access (e.g. chrome:// pages)
    }
  }

  return contexts;
}

async function extractTabContent(tabId: number): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.scripting) return null;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Extract main content, excluding nav, header, footer, sidebar
        const selectors = ['main', 'article', '[role="main"]', '.content', '#content'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent && el.textContent.trim().length > 100) {
            return el.textContent.trim();
          }
        }
        return document.body?.innerText?.trim() || null;
      },
    });
    return results?.[0]?.result || null;
  } catch {
    return null;
  }
}

/**
 * Get a lightweight list of open tabs (no content extraction).
 */
export async function listOpenTabs(settings: PrivacySettings): Promise<TabInfo[]> {
  if (typeof chrome === 'undefined' || !chrome.tabs) return [];

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const tabInfos = tabs
    .filter((t) => t.id !== undefined && t.url && t.title)
    .map((t) => ({
      tabId: t.id!,
      title: t.title || '',
      url: t.url || '',
    }));

  const { allowed } = filterSensitiveTabs(tabInfos, settings);
  return allowed;
}
