import type { LLMProvider, ProviderConfig, ProviderState } from '@draftly/shared';

/**
 * Central registry for LLM provider adapters.
 * Manages discovery, instantiation, and configuration of providers.
 */
export class ProviderRegistry {
  private providers = new Map<string, LLMProvider>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregister(id: string): void {
    this.providers.delete(id);
  }

  get(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  listAvailable(): { id: string; name: string; icon: string; authType: string }[] {
    return this.getAll().map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      authType: p.authType,
    }));
  }

  configure(id: string, config: ProviderConfig): boolean {
    const provider = this.providers.get(id);
    if (!provider) return false;
    provider.configure(config);
    return true;
  }

  /** Restore provider configurations from saved settings. */
  restoreFromStates(states: Record<string, ProviderState>): void {
    for (const [id, state] of Object.entries(states)) {
      if (state.configured) {
        this.configure(id, state.config);
      }
    }
  }

  /** Export current provider states for persistence. */
  exportStates(): Record<string, ProviderState> {
    const states: Record<string, ProviderState> = {};
    for (const provider of this.getAll()) {
      states[provider.id] = {
        id: provider.id,
        configured: !!provider.id, // simplified check
        config: {}, // Don't export raw API keys — handled by storage layer
      };
    }
    return states;
  }

  async validateProvider(id: string): Promise<boolean> {
    const provider = this.providers.get(id);
    if (!provider) return false;
    return provider.validateConnection();
  }
}

/** Singleton registry instance. */
let _registry: ProviderRegistry | null = null;

export function getRegistry(): ProviderRegistry {
  if (!_registry) {
    _registry = new ProviderRegistry();
  }
  return _registry;
}

export function resetRegistry(): void {
  _registry = null;
}
