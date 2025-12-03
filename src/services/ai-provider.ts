/**
 * AI Provider Abstraction Layer
 * Supports switching between OpenAI (GPT-4o, GPT-4o-mini) and Anthropic (Claude)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { log, LogCategory } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type AIProvider = 'openai' | 'anthropic';
export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini';
export type AnthropicModel = 'claude-3-5-sonnet-20241022' | 'claude-3-haiku-20240307';

export interface AIProviderConfig {
  provider: AIProvider;
  model?: string; // If not specified, uses default for provider
  temperature?: number;
  maxTokens?: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  provider: AIProvider;
}

// ============================================================================
// PROVIDER DEFAULTS
// ============================================================================

const OPENAI_DEFAULT_MODEL: OpenAIModel = 'gpt-4o-mini'; // Cheapest, fastest
const ANTHROPIC_DEFAULT_MODEL: AnthropicModel = 'claude-3-5-sonnet-20241022'; // Best quality

const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_MAX_TOKENS = 1000;

// ============================================================================
// MAIN AI PROVIDER CLASS
// ============================================================================

export class AIProviderService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private currentProvider: AIProvider;

  constructor(provider: AIProvider = 'openai') {
    this.currentProvider = provider;
    this.initializeClients();
  }

  /**
   * Initialize API clients based on available keys
   */
  private initializeClients() {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (openaiKey && openaiKey !== 'your-openai-key-here') {
      this.openaiClient = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });
      log.info(LogCategory.SERVICE, 'OpenAI client initialized');
    }

    if (anthropicKey && anthropicKey !== 'your-anthropic-key-here') {
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
      log.info(LogCategory.SERVICE, 'Anthropic client initialized');
    }

    if (!this.openaiClient && !this.anthropicClient) {
      log.warn(LogCategory.SERVICE, 'No AI providers configured. Please add API keys to .env');
    }
  }

  /**
   * Switch provider (OpenAI or Anthropic)
   */
  setProvider(provider: AIProvider) {
    this.currentProvider = provider;
    log.info(LogCategory.SERVICE, `AI provider switched to: ${provider}`);
  }

  /**
   * Get current provider
   */
  getProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Check if a provider is available (has API key)
   */
  isProviderAvailable(provider: AIProvider): boolean {
    if (provider === 'openai') {
      return this.openaiClient !== null;
    } else {
      return this.anthropicClient !== null;
    }
  }

  /**
   * Send a chat completion request
   */
  async sendMessage(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<AIResponse> {
    const provider = config?.provider || this.currentProvider;
    const temperature = config?.temperature ?? DEFAULT_TEMPERATURE;
    const maxTokens = config?.maxTokens ?? DEFAULT_MAX_TOKENS;

    log.debug(LogCategory.SERVICE, 'Sending AI request', {
      provider,
      messageCount: messages.length,
      temperature,
      maxTokens,
    });

    if (provider === 'openai') {
      return this.sendOpenAIRequest(messages, config?.model, temperature, maxTokens);
    } else {
      return this.sendAnthropicRequest(messages, config?.model, temperature, maxTokens);
    }
  }

  /**
   * Send request to OpenAI (GPT-4o, GPT-4o-mini)
   */
  private async sendOpenAIRequest(
    messages: AIMessage[],
    model?: string,
    temperature: number = DEFAULT_TEMPERATURE,
    maxTokens: number = DEFAULT_MAX_TOKENS
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Please add VITE_OPENAI_API_KEY to .env');
    }

    const selectedModel = model || OPENAI_DEFAULT_MODEL;

    try {
      const startTime = Date.now();

      const response = await this.openaiClient.chat.completions.create({
        model: selectedModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature,
        max_tokens: maxTokens,
      });

      const duration = Date.now() - startTime;

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      log.info(LogCategory.SERVICE, 'OpenAI request completed', {
        model: selectedModel,
        duration: `${duration}ms`,
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
      });

      return {
        content,
        model: selectedModel,
        usage: usage ? {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
        provider: 'openai',
      };
    } catch (error) {
      log.error(LogCategory.SERVICE, 'OpenAI request failed', error as Error);
      throw error;
    }
  }

  /**
   * Send request to Anthropic (Claude)
   */
  private async sendAnthropicRequest(
    messages: AIMessage[],
    model?: string,
    temperature: number = DEFAULT_TEMPERATURE,
    maxTokens: number = DEFAULT_MAX_TOKENS
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized. Please add VITE_ANTHROPIC_API_KEY to .env');
    }

    const selectedModel = model || ANTHROPIC_DEFAULT_MODEL;

    try {
      const startTime = Date.now();

      // Separate system message from user/assistant messages
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages
        .filter(m => m.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      const response = await this.anthropicClient.messages.create({
        model: selectedModel,
        max_tokens: maxTokens,
        temperature,
        system: systemMessage?.content,
        messages: conversationMessages,
      });

      const duration = Date.now() - startTime;

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      log.info(LogCategory.SERVICE, 'Anthropic request completed', {
        model: selectedModel,
        duration: `${duration}ms`,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      return {
        content,
        model: selectedModel,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        provider: 'anthropic',
      };
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Anthropic request failed', error as Error);
      throw error;
    }
  }

  /**
   * Calculate estimated cost for a request
   */
  estimateCost(
    _provider: AIProvider,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Pricing per 1M tokens (as of Dec 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      // OpenAI
      'gpt-4o': { input: 2.50, output: 10.00 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },

      // Anthropic
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    };

    const modelPricing = pricing[model];
    if (!modelPricing) {
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

    return inputCost + outputCost;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Get default provider from localStorage if available
const getDefaultProvider = (): AIProvider => {
  try {
    const stored = localStorage.getItem('uproot_ai_provider');
    return (stored === 'openai' || stored === 'anthropic') ? stored : 'openai';
  } catch {
    return 'openai';
  }
};

export const aiProvider = new AIProviderService(getDefaultProvider());

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple wrapper for single-shot completions
 */
export async function generateAICompletion(
  prompt: string,
  config?: Partial<AIProviderConfig>
): Promise<string> {
  const response = await aiProvider.sendMessage(
    [{ role: 'user', content: prompt }],
    config
  );
  return response.content;
}

/**
 * Get available providers (those with API keys configured)
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (aiProvider.isProviderAvailable('openai')) providers.push('openai');
  if (aiProvider.isProviderAvailable('anthropic')) providers.push('anthropic');
  return providers;
}

/**
 * Save provider preference to localStorage
 */
export function saveProviderPreference(provider: AIProvider) {
  try {
    localStorage.setItem('uproot_ai_provider', provider);
    aiProvider.setProvider(provider);
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Failed to save provider preference', error as Error);
  }
}
