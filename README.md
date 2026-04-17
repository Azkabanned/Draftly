# Draftly

**Bring-your-own-LLM writing assistant.** A Chrome extension that gives you AI-powered writing assistance everywhere — using your own API keys and models.

Think Grammarly, but powered by Claude, GPT, Gemini, or any OpenAI-compatible model you choose.

## Features

- **Text rewriting** — fix grammar, sharpen, shorten, expand, change tone
- **Command palette** — slash commands (`/fix`, `/rewrite`, `/sharpen`, etc.)
- **Multiple providers** — Anthropic, OpenAI, Gemini, OpenRouter, custom endpoints
- **Privacy-first** — API keys stored locally, PII redaction, audit log
- **Tab context** — optionally use content from open tabs as AI context
- **Works everywhere** — any text field, textarea, or contenteditable element
- **Keyboard-first** — `Ctrl+Shift+D` / `Cmd+Shift+D` to open instantly

## Architecture

```
Draftly/
├── packages/
│   ├── shared/            # Types, constants, utilities
│   ├── providers/         # LLM provider abstraction + adapters
│   ├── core/              # Prompts, transforms, privacy, context engine
│   ├── ui/                # Shared React components
│   └── word-integration/  # Microsoft Word support scaffold
├── apps/
│   ├── extension/         # Chrome Extension (Manifest V3)
│   └── settings-web/      # Settings dashboard (Vite + React)
```

### Provider Adapter Pattern

Each LLM provider implements the `LLMProvider` interface:

```typescript
interface LLMProvider {
  id: string;
  name: string;
  configure(config: ProviderConfig): void;
  listModels(): Model[];
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncGenerator<StreamChunk>;
  estimateCost(request: CompletionRequest): CostEstimate | null;
  validateConnection(): Promise<boolean>;
}
```

Adding a new provider means implementing this interface. See `packages/providers/src/adapters/` for examples.

### Privacy Model

- API keys are stored in Chrome's local storage, never synced
- PII redaction strips emails, phones, credit cards, SSNs before sending
- Sensitive domain blocklist prevents tab context from banking/auth sites
- Audit log records what was sent, to which provider, with what context
- Tab context requires explicit user consent per use

## Quick Start

### Install from Release (no coding required)

1. Download `draftly-v0.1.0.zip` from the [latest release](https://github.com/Azkabanned/Draftly/releases/latest)
2. Unzip it
3. Open Chrome and go to `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the `dist` folder from the zip
6. Click the Draftly icon in the toolbar to configure your AI provider

### Build from Source

If you want to build it yourself:

**Prerequisites:** Node.js 18+, pnpm 9+

```bash
git clone https://github.com/Azkabanned/Draftly.git
cd Draftly
pnpm install
pnpm build:ext
```

Then load `apps/extension/dist` as an unpacked extension in Chrome.

### Ollama / Local Model Setup

If using Ollama, you must allow the Chrome extension origin or requests will be blocked with a 403 error.

```bash
# Stop any running Ollama instance, then start with:
OLLAMA_ORIGINS="chrome-extension://*" ollama serve

# Or to run in the background:
OLLAMA_ORIGINS="chrome-extension://*" nohup ollama serve > /dev/null 2>&1 &
```

If Ollama runs as a macOS menu bar app:
```bash
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"
# Then quit and reopen Ollama from the menu bar
```

To make this permanent, add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export OLLAMA_ORIGINS="chrome-extension://*"
```

Then in Draftly settings:
1. Select **Local / Custom Inference** as your provider
2. Set the base URL (default: `http://localhost:11434/v1`)
3. Click **Scan for Models** to detect available models
4. Select a model and save

LM Studio and vLLM generally don't have this CORS restriction — just set the correct base URL.

### Development

```bash
# Watch mode for the extension (rebuilds on changes)
pnpm dev

# Run the settings web app in dev mode
cd apps/settings-web && pnpm dev

# Run tests
pnpm test

# Type check
pnpm lint
```

## How It Works

1. **Select text** on any web page
2. A small **Draftly button** appears near your selection
3. Click it (or press `Ctrl+Shift+D`) to open the **command palette**
4. Choose an action: `/fix`, `/rewrite`, `/sharpen`, `/shorten`, etc.
5. Draftly sends your text to your chosen AI provider
6. **Replace** the selection, **insert below**, or **copy** the result
7. You can also **right-click** and choose "Rewrite with Draftly"

## Writing Actions

| Command | Description |
|---------|-------------|
| `/fix` | Fix grammar, spelling, and punctuation |
| `/rewrite` | Rewrite for clarity |
| `/sharpen` | Make tighter and more precise |
| `/shorten` | Make more concise |
| `/expand` | Add more detail |
| `/professional` | Professional tone |
| `/friendly` | Warm, conversational tone |
| `/persuasive` | More compelling and convincing |
| `/simplify` | Simpler words and shorter sentences |
| `/reply` | Generate a reply |
| `/summarise` | Create a concise summary |
| `/custom` | Your own instruction |

## Supported Providers

| Provider | Auth | Status |
|----------|------|--------|
| Anthropic (Claude) | API key | Full support |
| OpenAI (GPT) | API key | Full support |
| Google Gemini | API key | Full support |
| OpenRouter | API key | Full support |
| Custom (Ollama, LM Studio, etc.) | Optional API key | Full support |

## Privacy & Security

Draftly is designed to be transparent about what data it handles:

- **Local-only storage** — API keys and settings never leave your device
- **No tracking** — Draftly has no analytics, no telemetry, no server
- **PII redaction** — Optionally strip sensitive data before sending
- **Sensitive site blocking** — Banking, auth, healthcare sites excluded from tab context
- **Audit log** — See exactly what was sent and to which provider
- **Consent-driven** — Tab context always requires explicit permission

## Microsoft Word Support

### Phase 1 (Current): Word Online

The Chrome extension works with Word Online (`word-edit.officeapps.live.com`) since it uses contenteditable HTML. Select text in Word Online and use Draftly as you would on any page.

### Phase 2 (Planned): Native Word Add-in

See `packages/word-integration/WORD_ADDIN_PLAN.md` for the technical plan. The core logic (providers, prompts, transforms) is shared — only the Office.js integration layer needs to be built.

## Roadmap

### Next Up
- [ ] Inline grammar underlines
- [ ] Local model support (Ollama, LM Studio, MLX)
- [ ] Custom prompt editor in settings
- [ ] Streaming responses in command box
- [ ] Token cost tracking over time

### Future
- [ ] Team prompt sharing
- [ ] Cloud sync for settings
- [ ] Native Office Word add-in
- [ ] Safari and Edge extension ports
- [ ] Mobile keyboard integration
- [ ] Custom workflows / prompt chains
- [ ] Bring-your-own-RAG knowledge base

## Tech Stack

- **Extension**: Chrome Manifest V3, esbuild
- **UI**: React 18, Tailwind CSS
- **State**: Zustand + Chrome Storage API
- **Language**: TypeScript (strict)
- **Build**: pnpm workspaces, esbuild, Vite
- **Tests**: Vitest

## License

MIT
