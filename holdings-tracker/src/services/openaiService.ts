import { ENV } from '../config/env';
import type { RationaleRequest, CachedRationale } from '../types';

class OpenAIService {
  private readonly API_KEY = ENV.OPENAI_API_KEY;
  private readonly MODEL = 'gpt-4o';
  private readonly CACHE_KEY_PREFIX = 'rationale_';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Generate investment rationale with localStorage caching
   */
  async generateRationale(request: RationaleRequest): Promise<string> {
    // Check cache first
    const cached = this.getCachedRationale(request);
    if (cached) {
      console.log('✅ Rationale loaded from cache');
      return cached;
    }

    // Generate new rationale
    const prompt = this.buildPrompt(request);
    const rationale = await this.callOpenAI(prompt);

    // Cache the result
    this.cacheRationale(request, rationale);

    return rationale;
  }

  /**
   * Build dynamic prompt based on fund and position
   */
  private buildPrompt(request: RationaleRequest): string {
    const { ticker, companyName, fundName, position, quarterlyChange } = request;

    let prompt = `Analyze ${fundName}'s position in ${companyName}${ticker ? ` (${ticker})` : ''}.

Position Details:
- Shares: ${position.shares.toLocaleString()}
- Market Value: $${position.value.toLocaleString()}
- Portfolio Weight: ${position.percentOfPortfolio.toFixed(2)}%
`;

    if (quarterlyChange) {
      if (quarterlyChange.isNew) {
        prompt += `\n📈 NEW POSITION this quarter\n`;
      } else if (quarterlyChange.isClosed) {
        prompt += `\n📉 POSITION CLOSED this quarter\n`;
      } else {
        prompt += `
Quarterly Change:
- Shares Change: ${quarterlyChange.sharesDelta > 0 ? '+' : ''}${quarterlyChange.sharesDelta.toLocaleString()} (${quarterlyChange.percentChange > 0 ? '+' : ''}${quarterlyChange.percentChange.toFixed(2)}%)
- Value Change: $${quarterlyChange.valueDelta.toLocaleString()}
`;
      }
    }

    prompt += `
Provide a concise investment rationale (2-3 paragraphs) covering:
1. Why ${fundName} might find this position attractive given typical institutional investment strategies
2. Key business fundamentals or market factors that could support this holding
3. Potential risks or considerations for this position

Write in a professional, analytical tone suitable for financial analysis.`;

    return prompt;
  }

  /**
   * Call OpenAI API with error handling
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.API_KEY || this.API_KEY === 'user_will_add_their_key_here') {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a professional financial analyst providing institutional investment analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate rationale. Please check your API key and try again.');
    }
  }

  /**
   * Get cached rationale if exists and not expired
   */
  private getCachedRationale(request: RationaleRequest): string | null {
    const cacheKey = this.generateCacheKey(request);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    try {
      const parsed: CachedRationale = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      if (age > this.CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.rationale;
    } catch {
      return null;
    }
  }

  /**
   * Cache rationale in localStorage
   */
  private cacheRationale(request: RationaleRequest, rationale: string): void {
    const cacheKey = this.generateCacheKey(request);
    const cached: CachedRationale = {
      rationale,
      timestamp: Date.now(),
      request,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cached));
      console.log('💾 Rationale cached successfully');
    } catch (error) {
      console.warn('Failed to cache rationale:', error);
    }
  }

  /**
   * Generate unique cache key for request
   */
  private generateCacheKey(request: RationaleRequest): string {
    // Key includes ticker/company, fund, and value to ensure uniqueness
    const identifier = request.ticker || request.companyName.replace(/\s+/g, '_');
    const key = `${identifier}_${request.fundName.replace(/\s+/g, '_')}_${Math.floor(request.position.value / 1000000)}M`;
    return `${this.CACHE_KEY_PREFIX}${key}`;
  }

  /**
   * Clear all cached rationales
   */
  clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Rationale cache cleared');
  }
}

export const openaiService = new OpenAIService();
