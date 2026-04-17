# Microsoft Word Add-in — Technical Plan

## Overview

Draftly's Word integration follows a two-phase approach:

### Phase 1: Word Online (Current — via Chrome Extension)

The Chrome extension's content script already works on Word Online
(`word-edit.officeapps.live.com` and SharePoint-hosted documents) because
Word Online renders documents using contenteditable HTML.

The `WordOnlineAdapter` class provides:
- Selection detection via `window.getSelection()`
- Text replacement via `document.execCommand('insertText')`
- Insert-after via Range manipulation

This works today with no extra infrastructure.

### Phase 2: Native Office Add-in (Future)

For desktop Word support, we need a dedicated Office Add-in:

#### Architecture

```
packages/word-addin/
├── manifest.xml          # Office Add-in manifest
├── src/
│   ├── taskpane/
│   │   ├── index.html    # Taskpane HTML entry
│   │   ├── main.tsx      # React entry
│   │   └── TaskPane.tsx  # Embeds CommandBox from @draftly/ui
│   ├── commands/
│   │   └── commands.ts   # Ribbon button handlers
│   └── office-api/
│       └── word.ts       # Office.js Word API wrapper
```

#### Key Office.js APIs

```typescript
// Get selected text
await Word.run(async (context) => {
  const range = context.document.getSelection();
  range.load('text');
  await context.sync();
  return range.text;
});

// Replace selection
await Word.run(async (context) => {
  const range = context.document.getSelection();
  range.insertText(newText, Word.InsertLocation.replace);
  await context.sync();
});

// Insert with formatting
await Word.run(async (context) => {
  const range = context.document.getSelection();
  const para = range.insertParagraph(newText, Word.InsertLocation.after);
  para.font.italic = true;
  await context.sync();
});
```

#### Shared Code

The add-in reuses:
- `@draftly/shared` — types, constants
- `@draftly/providers` — LLM provider abstraction
- `@draftly/core` — prompts, transforms, privacy
- `@draftly/ui` — CommandBox, DiffView, ResultView components

The only new code is the Office.js API integration layer and the
add-in manifest.

#### Deployment

1. **Sideloading**: For development, sideload via Office's "Insert Add-in" menu
2. **Centralised deployment**: Deploy to an organisation via Microsoft 365 admin
3. **AppSource**: Publish publicly on Microsoft AppSource

#### Requirements

- Node.js 18+
- `@microsoft/office-js` npm package
- Office Add-in Development Tools (`yo office`)
- HTTPS for development (Office.js requires it)

#### Timeline estimate

- Scaffold add-in project: 1 day
- Implement `OfficeBridge`: 2 days
- Integrate Draftly UI in taskpane: 2 days
- Testing and polish: 2 days
- Total: ~1 week from the point where core Draftly is stable
