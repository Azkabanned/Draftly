import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { ActionId, Model } from '@draftly/shared';
import type { TransformResult } from '@draftly/core';
import { CommandBox, FloatingButton } from '@draftly/ui';
import type { CommandBoxState } from '@draftly/ui';
import {
  getSelectedText,
  getSelectionRect,
  replaceSelection,
  insertBelowSelection,
  saveSelection,
} from './selection';

// ---- Shadow DOM Host ----

const HOST_ID = 'draftly-extension-host';

function getOrCreateHost(): ShadowRoot {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0; width: 0; height: 0; overflow: visible;';
    document.body.appendChild(host);
  }

  if (!host.shadowRoot) {
    const shadow = host.attachShadow({ mode: 'open' });

    // Inject Tailwind CSS from the compiled file
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('content.css');
    shadow.appendChild(link);

    // Inject critical inline styles (animation + reset)
    const style = document.createElement('style');
    style.textContent = `
      @keyframes draftly-fade-in {
        from { opacity: 0; transform: translateY(4px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #draftly-root { all: initial; font-family: Inter, system-ui, -apple-system, sans-serif; }
      #draftly-root * { box-sizing: border-box; }
    `;
    shadow.appendChild(style);

    // Add a container for React
    const container = document.createElement('div');
    container.id = 'draftly-root';
    shadow.appendChild(container);
  }

  return host.shadowRoot!;
}

// ---- Content Script App ----

function DraftlyApp() {
  const [selectedText, setSelectedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [showCommandBox, setShowCommandBox] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [commandBoxPos, setCommandBoxPos] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<CommandBoxState>('idle');
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [partialResult, setPartialResult] = useState<string>();
  const [result, setResult] = useState<TransformResult>();
  const [error, setError] = useState<string>();

  const selectionRef = useRef<string>('');

  // Fetch available models and default selection on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_MODELS' }, (response) => {
      if (response?.providers) {
        const allModels: Model[] = [];
        const provList: { id: string; name: string }[] = [];
        for (const p of response.providers) {
          provList.push({ id: p.providerId, name: p.providerName });
          allModels.push(...p.models);
        }

        // If the default model isn't in the list, add it (e.g. scanned Ollama model)
        const defaultId = response.defaultModelId;
        if (defaultId && !allModels.find((m) => m.id === defaultId)) {
          allModels.push({
            id: defaultId,
            name: defaultId,
            provider: response.defaultProviderId || 'custom',
            maxTokens: 4096,
            contextWindow: 8192,
            supportsStreaming: true,
          });
        }

        setModels(allModels);
        setProviders(provList);
        if (defaultId) setSelectedModel(defaultId);
        else if (allModels.length > 0) setSelectedModel(allModels[0].id);
      }
    });
  }, []);

  // Track mouse position for button placement
  const mousePos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const trackMouse = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener('mousemove', trackMouse, { passive: true });
    return () => document.removeEventListener('mousemove', trackMouse);
  }, []);

  // Listen for selection changes — use mouseup to detect when user finishes selecting
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    const checkSelection = (e?: Event) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (showCommandBox) return;
        const text = getSelectedText();
        if (text && text.length > 1) {
          setSelectedText(text);
          selectionRef.current = text;
          // Position button near the mouse cursor where the user finished selecting
          setButtonPos({
            x: Math.min(mousePos.current.x + 10, window.innerWidth - 120),
            y: Math.max(8, mousePos.current.y - 40),
          });
          setShowButton(true);
        } else if (!text) {
          setShowButton(false);
        }
      }, 150);
    };

    document.addEventListener('mouseup', checkSelection);

    return () => {
      document.removeEventListener('mouseup', checkSelection);
      clearTimeout(debounceTimer);
    };
  }, [showCommandBox]);

  // Hide button on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showButton && !showCommandBox) setShowButton(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showButton, showCommandBox]);

  // Listen for messages from background/popup
  useEffect(() => {
    const handler = (message: any) => {
      if (message.type === 'OPEN_COMMAND_BOX' || message.type === 'TOGGLE_DRAFTLY') {
        const text = message.selectedText || getSelectedText();
        if (text) {
          setSelectedText(text);
          selectionRef.current = text;
          openCommandBox();
        }
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const openCommandBox = useCallback(() => {
    // Save the selection BEFORE the command box steals focus
    saveSelection();
    const rect = getSelectionRect();
    if (rect) {
      // Position command box near selection but not overlapping
      const x = Math.min(rect.left, window.innerWidth - 400);
      const y = Math.min(rect.bottom + 8, window.innerHeight - 400);
      setCommandBoxPos({ x: Math.max(8, x), y: Math.max(8, y) });
    } else {
      // Center on screen
      setCommandBoxPos({
        x: Math.max(8, (window.innerWidth - 380) / 2),
        y: Math.max(8, (window.innerHeight - 400) / 3),
      });
    }
    setShowButton(false);
    setShowCommandBox(true);
    setState('idle');
    setResult(undefined);
    setError(undefined);
    setPartialResult(undefined);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowCommandBox(false);
    setShowButton(false);
    setState('idle');
    setResult(undefined);
    setError(undefined);
    setPartialResult(undefined);
  }, []);

  const handleExecuteAction = useCallback(
    (action: ActionId, customInstruction?: string) => {
      setState('loading');
      setPartialResult(undefined);
      setError(undefined);

      chrome.runtime.sendMessage(
        {
          type: 'EXECUTE_ACTION',
          action,
          selectedText: selectionRef.current,
          customInstruction,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            setState('error');
            setError(chrome.runtime.lastError.message);
            return;
          }
          if (response?.error) {
            setState('error');
            setError(response.error);
            return;
          }
          if (response?.result) {
            setState('result');
            setResult(response.result);
          }
        },
      );
    },
    [],
  );

  const handleReplace = useCallback((text: string) => {
    replaceSelection(text);
    handleDismiss();
  }, [handleDismiss]);

  const handleInsertBelow = useCallback((text: string) => {
    insertBelowSelection(text);
    handleDismiss();
  }, [handleDismiss]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <>
      <FloatingButton
        position={buttonPos}
        onClick={openCommandBox}
        visible={showButton}
      />

      {showCommandBox && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[2147483646]"
            style={{ pointerEvents: 'auto' }}
            onClick={handleDismiss}
          />
          {/* Command box */}
          <div
            className="fixed z-[2147483647]"
            style={{
              left: `${commandBoxPos.x}px`,
              top: `${commandBoxPos.y}px`,
              pointerEvents: 'auto',
            }}
          >
            <CommandBox
              selectedText={selectedText}
              models={models}
              selectedModel={selectedModel}
              providers={providers}
              onSelectModel={setSelectedModel}
              onExecuteAction={handleExecuteAction}
              onReplace={handleReplace}
              onInsertBelow={handleInsertBelow}
              onCopy={handleCopy}
              onDismiss={handleDismiss}
              state={state}
              partialResult={partialResult}
              result={result}
              error={error}
            />
          </div>
        </>
      )}
    </>
  );
}

// ---- Mount ----

function mount() {
  const shadow = getOrCreateHost();
  const container = shadow.getElementById('draftly-root');
  if (!container) return;

  const root = createRoot(container);
  root.render(<DraftlyApp />);

  // Grammar checker disabled for now — parked feature
  // import { initGrammarChecker } from './grammar';
  // initGrammarChecker();
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
