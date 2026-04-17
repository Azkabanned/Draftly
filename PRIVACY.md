# Draftly Privacy Policy

**Last updated: 17 April 2026**

## The short version

Draftly has no servers. We never see, collect, or store any of your data. Everything stays on your device or goes directly to the AI provider you choose to connect.

## What Draftly does

Draftly is a browser extension that helps you rewrite, fix, and improve text using AI models that **you** provide. You bring your own AI — either a local model running on your machine (Ollama, LM Studio, etc.) or a remote provider you already pay for (OpenAI, Anthropic, Google Gemini, OpenRouter, or any OpenAI-compatible endpoint).

## Data we collect

None. Zero. Draftly has no backend, no servers, no analytics, no telemetry, and no tracking of any kind.

## Where your data goes

When you use Draftly to rewrite or fix text, your selected text is sent **directly from your browser** to the AI provider you configured:

- **Local models (Ollama, LM Studio, vLLM):** Your text never leaves your machine. It goes from the browser to `localhost`. Nothing is transmitted over the internet.
- **Remote providers (OpenAI, Anthropic, Gemini, OpenRouter, etc.):** Your text is sent directly to that provider's API using your own API key. Draftly acts as a pass-through — we are not an intermediary, proxy, or middleman. The data travels from your browser straight to the provider. Their privacy policy governs how they handle your data.

Draftly never routes your text through any Draftly-owned server or third-party service.

## API keys

Your API keys are stored locally in your browser's extension storage on your device. They are never transmitted anywhere except directly to the provider they belong to, as an authentication header in API requests you initiate.

## Tab context

Draftly has an optional feature that can read content from your open browser tabs to provide additional context to the AI. This feature:

- Is **off by default**
- Requires **explicit opt-in** in settings
- Asks for your **consent each time** (configurable)
- **Never reads sensitive sites** — banking, healthcare, password managers, auth pages, and payment sites are blocked by default
- Sends tab content **only to your chosen AI provider**, only when you approve it

You can add or remove sites from the blocklist in settings.

## PII redaction

Draftly includes an optional redaction pipeline that can strip sensitive information (emails, phone numbers, credit card numbers, Social Security numbers) from your text **before** it is sent to any AI provider. This runs entirely in your browser — no data is sent anywhere for redaction.

## Audit log

Draftly can keep a local log of what text was sent, which provider was used, and what context was attached. This log is stored entirely on your device in browser extension storage. It is never transmitted anywhere. You can clear it at any time from settings.

## What we don't do

- We don't have servers
- We don't collect analytics or usage data
- We don't track you
- We don't see your text, your API keys, or your browsing activity
- We don't sell, share, or transfer any data — because we don't have any
- We don't use cookies
- We don't run any background network requests to Draftly-owned infrastructure (there is none)

## Permissions explained

| Permission | Why |
|---|---|
| `activeTab` | Read selected text on the current page so Draftly can process it |
| `storage` | Store your settings and API keys locally on your device |
| `contextMenus` | Add "Rewrite with Draftly" to the right-click menu |
| `scripting` | Inject the Draftly UI (floating button, command box) into web pages |
| `tabs` (optional) | List open tabs for the optional tab context feature |
| `host_permissions: <all_urls>` | Allow Draftly to work on any website and connect to your AI provider's API |

## Third parties

The only third parties involved are the AI providers **you** choose to connect. Draftly does not have partnerships, data-sharing agreements, or integrations with any service. We are a local tool that connects you to your own accounts.

Relevant provider privacy policies:
- OpenAI: https://openai.com/privacy
- Anthropic: https://www.anthropic.com/privacy
- Google: https://ai.google.dev/terms
- OpenRouter: https://openrouter.ai/privacy

## Children

Draftly is not directed at children under 13.

## Changes

If this policy changes, the updated version will be included in the extension and posted in the repository.

## Contact

For privacy questions, open an issue at the project repository.
