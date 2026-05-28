import { AISettings } from '@app-types/index';

export interface AIActionResult {
  text: string;
  raw?: unknown;
}

export interface AutocompleteContext {
  content: string;
  cursorOffset: number;
}

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1';

const normalizeEndpoint = (endpoint: string): string => endpoint.trim().replace(/\/+$/, '') || DEFAULT_ENDPOINT;

const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

class AIService {
  private buildHeaders(settings: AISettings): HeadersInit {
    return {
      Authorization: 'Bearer ' + settings.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private async requestChatCompletion(
    settings: AISettings,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    maxTokens?: number
  ): Promise<string> {
    if (!settings.enabled) {
      throw new Error('AI is disabled');
    }

    if (!settings.apiKey.trim()) {
      throw new Error('Missing API key');
    }

    const endpoint = normalizeEndpoint(settings.endpoint);
    const response = await runWithTimeout(
      fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(settings),
        body: JSON.stringify({
          model: settings.model.trim() || 'gpt-4o-mini',
          messages,
          temperature: settings.temperature,
          max_tokens: maxTokens ?? settings.maxTokens,
        }),
      })
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return payload.choices?.[0]?.message?.content?.trim() ?? '';
  }

  async testConnection(settings: AISettings): Promise<string> {
    const result = await this.requestChatCompletion(settings, [
      { role: 'system', content: 'Respond with a short confirmation only.' },
      { role: 'user', content: 'Test connection' },
    ], 1);

    return result || 'Connection successful';
  }

  async explainCode(code: string, settings: AISettings): Promise<AIActionResult> {
    const text = await this.requestChatCompletion(settings, [
      { role: 'system', content: 'Explain code clearly and concisely.' },
      { role: 'user', content: `Explain this code:\n\n${code}` },
    ]);

    return { text };
  }

  async generateCode(prompt: string, settings: AISettings): Promise<AIActionResult> {
    const text = await this.requestChatCompletion(settings, [
      { role: 'system', content: 'Return only the code requested by the user.' },
      { role: 'user', content: prompt },
    ], settings.maxTokens);

    return { text };
  }

  async autocomplete(context: AutocompleteContext, settings: AISettings): Promise<AIActionResult> {
    const cursorPreview = context.content.slice(Math.max(0, context.cursorOffset - 300), context.cursorOffset);
    const text = await this.requestChatCompletion(settings, [
      { role: 'system', content: 'Continue the code at the cursor. Return only the next snippet.' },
      { role: 'user', content: `Continue from here:\n\n${cursorPreview}` },
    ], 128);

    return { text };
  }
}

export const aiService = new AIService();
export default aiService;
