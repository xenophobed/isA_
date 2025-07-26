/**
 * ============================================================================
 * Model Service (modelService.ts) - Simple ISA Model Client
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Client initialization
 * - client.invoke call
 * - Handle final result content
 * - Minimal overhead design
 */

import { logger, LogCategory } from '../utils/logger';
import { config } from '../config';

// ================================================================================
// Types and Interfaces
// ================================================================================

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelResponse {
  content: string;
  success: boolean;
  error?: string;
  billing?: any;
}

// ================================================================================
// ModelService Class
// ================================================================================

export class ModelService {
  private baseUrl: string;

  constructor(isaUrl?: string) {
    this.baseUrl = isaUrl || config.externalApis.aiServiceUrl;
    logger.info(LogCategory.API_CALL, 'ISA ModelService initialized', { url: this.baseUrl });
  }

  /**
   * Simple model call - client.invoke equivalent
   */
  async callModel(
    messages: ModelMessage[],
    model?: string,
    timeout: number = 30000
  ): Promise<ModelResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('Messages required');
    }

    // Build args - minimal overhead
    const args = {
      input_data: messages,
      task: 'chat',
      service_type: 'text'
    };

    if (model) {
      (args as any).model = model;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Call ISA Model Service - client.invoke equivalent
      const response = await fetch(`${this.baseUrl}/api/v1/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_data: messages[messages.length - 1].content, // Use last message content directly
          task: 'chat',
          service_type: 'text',
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Model API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Model call failed: ${result.error || 'Unknown error'}`);
      }

      // Return final result content from result.content
      return {
        content: result.result?.content || '',
        success: true,
        billing: result.metadata?.billing
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Model timeout after ${timeout}ms`);
      }
      
      logger.error(LogCategory.API_CALL, 'Model call failed', { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ================================================================================
// Singleton Instance
// ================================================================================

let modelServiceInstance: ModelService | null = null;

export const getModelService = (isaUrl?: string): ModelService => {
  if (!modelServiceInstance) {
    modelServiceInstance = new ModelService(isaUrl);
  }
  return modelServiceInstance;
};

export const callModel = async (
  messages: ModelMessage[],
  model?: string,
  timeout?: number
): Promise<ModelResponse> => {
  const service = getModelService();
  return await service.callModel(messages, model, timeout);
};

/**
 * AI-powered widget intent detection
 */
export const detectWidgetIntent = async (
  userInput: string,
  hasFiles: boolean = false
): Promise<string | null> => {
  // If files are uploaded, always suggest knowledge widget
  if (hasFiles) {
    return 'knowledge';
  }

  const prompt = `Analyze the intent of this user request and return only one of these exact widget names:
- dream: for image generation, drawing, create pictures
- hunt: for web search, product search, find items
- omni: for content writing, text generation
- assistant: for general help, questions
- data-scientist: for data analysis, charts, statistics
- knowledge: for document analysis (but user has no files)
- none: for unclear intent

User request: "${userInput}"

Return only one word: dream, hunt, omni, assistant, data-scientist, knowledge, or none`;

  try {
    const messages: ModelMessage[] = [
      { role: 'user', content: prompt }
    ];

    const response = await callModel(messages, undefined, 10000); // 10 second timeout
    
    if (!response.success || !response.content) {
      return null;
    }

    const result = response.content.trim().toLowerCase();
    
    // Validate result
    const validWidgets = ['dream', 'hunt', 'omni', 'assistant', 'data-scientist', 'knowledge'];
    
    if (validWidgets.includes(result)) {
      return result;
    }
    
    return null; // 'none' or invalid response

  } catch (error) {
    logger.warn(LogCategory.API_CALL, 'Intent detection failed', { error, userInput });
    return null;
  }
};

export default getModelService;