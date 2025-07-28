/**
 * ============================================================================
 * Chat Service (chatService.ts) - Unified Chat API Service
 * ============================================================================
 * 
 * Core Responsibilities:
 * - Uses BaseApiService for robust network transport
 * - Built-in SSE data parsing (SSEProcessor logic)
 * - Provides clean callback interface for state management
 * - Supports text and multimodal messages
 * 
 * Architecture Benefits:
 * ✅ Transport: BaseApiService robust HTTP/SSE handling
 * ✅ Parsing: Built-in SSE event parsing, no global variable hack
 * ✅ Interface: Structured callbacks with parsed data
 * ✅ Separation: chatService=transport+parsing, Store=state management
 * 
 * vs Old Architecture:
 * Old: AIClient(fetch) → window.streamingParser(SSEProcessor) → useChatStore
 * New: ChatService(BaseApiService + built-in parsing) → useChatStore
 */

import { BaseApiService } from './BaseApiService';
import { config } from '../config';
import { ChatServiceCallbacks, ChatMetadata } from '../types/chatTypes';
import { SSEParser, SSEParserCallbacks } from './SSEParser';
import { logger, LogCategory } from '../utils/logger';

// ================================================================================
// ChatService Class
// ================================================================================

export class ChatService {
  private apiService: BaseApiService;

  constructor(apiService?: BaseApiService) {
    // Use provided or create dedicated agent service instance
    this.apiService = apiService || new BaseApiService(config.api.baseUrl);
  }

  // ================================================================================
  // Public Methods - Message Sending Interface
  // ================================================================================

  /**
   * Send a message to the chat API with streaming response
   * @param message - The message content
   * @param metadata - Additional metadata (user_id, session_id, etc.)
   * @param token - Authentication token from Auth0
   * @param callbacks - Event callbacks for handling streaming responses
   */
  async sendMessage(
    message: string,
    metadata: ChatMetadata = {},
    token: string,
    callbacks: SSEParserCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(LogCategory.CHAT_FLOW, 'Starting chat request', {
        messageLength: message.length,
        metadata: {
          ...metadata,
          // Don't log sensitive data
          user_id: metadata.user_id ? '[REDACTED]' : undefined,
          session_id: metadata.session_id ? '[REDACTED]' : undefined
        }
      });

      // Prepare request body
      const requestBody = JSON.stringify({
        message,
        user_id: metadata.user_id || 'anonymous',
        session_id: metadata.session_id || 'default',
        prompt_name: metadata.prompt_name || null,
        prompt_args: metadata.prompt_args || {}
      });

      const url = `${config.api.baseUrl}/api/chat`;
      
      console.log('🌐 CHAT_SERVICE: Full request details:');
      console.log('  URL:', url);
      console.log('  Method: POST');
      console.log('  Headers:', {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Authorization': `Bearer ${token.substring(0, 20)}...` // Log partial token for debugging
      });
      console.log('  Body:', requestBody);
      console.log('  Body length:', requestBody.length);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        },
        body: requestBody
      });

      console.log('🌐 CHAT_SERVICE: Response status:', response.status);
      console.log('🌐 CHAT_SERVICE: Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🌐 CHAT_SERVICE: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🌐 CHAT_SERVICE: Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      await this.processStreamingResponse(response, callbacks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      callbacks.onError?.(new Error(`ChatService: ${errorMessage}`));
    }
  }

  /**
   * Send multimodal message (text + files)
   */
  async sendMultimodalMessage(
    content: string,
    files: File[] = [],
    metadata: ChatMetadata = {},
    token: string,
    callbacks: SSEParserCallbacks
  ): Promise<void> {
    try {
      const endpoint = '/api/chat';
      
      if (files.length === 0) {
        // Text-only message - use new API format
        // Use exact same field order as successful curl request
        const requestPayload = {
          message: content,
          session_id: metadata.session_id || 'test_session_fixed',
          user_id: metadata.auth0_id || metadata.user_id || 'test_user_fixed',
          prompt_name: metadata.prompt_name || null,
          prompt_args: metadata.prompt_args || {}
        };
        
        console.log('🌐 CHAT_SERVICE: Sending request payload:', JSON.stringify(requestPayload, null, 2));
        console.log('🌐 CHAT_SERVICE: Original metadata:', JSON.stringify(metadata, null, 2));
        console.log('🌐 CHAT_SERVICE: Request endpoint:', endpoint);
        
        await this.handleStreamingRequest(endpoint, requestPayload, callbacks);

      } else {
        // Multimodal message - use new API format with files
        const additionalData = {
          message: content,
          user_id: metadata.auth0_id || 'test_user',
          session_id: metadata.session_id || 'default',
          prompt_name: metadata.template_parameters?.template_id || null,
          prompt_args: JSON.stringify(metadata.template_parameters?.prompt_args || {})
        };

        await this.handleMultimodalStreamingRequest(endpoint, files, additionalData, callbacks);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      callbacks.onError?.(new Error(`ChatService: ${errorMessage}`));
    }
  }

  // ================================================================================
  // Private Methods - Streaming Request Handling
  // ================================================================================

  /**
   * Handle streaming text request
   */
  private async handleStreamingRequest(
    endpoint: string,
    data: any,
    callbacks: ChatServiceCallbacks
  ): Promise<void> {
    try {
      // Build full URL
      const url = this.apiService['buildUrl'](endpoint);
      
      const requestBody = JSON.stringify(data);
      console.log('🌐 CHAT_SERVICE: Full request details:');
      console.log('  URL:', url);
      console.log('  Method: POST');
      console.log('  Headers:', {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Authorization': 'Bearer dev_key_test'
      });
      console.log('  Body:', requestBody);
      console.log('  Body length:', requestBody.length);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Authorization': 'Bearer dev_key_test'
        },
        body: requestBody
      });

      console.log('🌐 CHAT_SERVICE: Response status:', response.status);
      console.log('🌐 CHAT_SERVICE: Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🌐 CHAT_SERVICE: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🌐 CHAT_SERVICE: Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      await this.processStreamingResponse(response, callbacks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      callbacks.onError?.(new Error(`Streaming request failed: ${errorMessage}`));
    }
  }

  /**
   * Handle multimodal streaming request with file upload
   */
  private async handleMultimodalStreamingRequest(
    endpoint: string,
    files: File[],
    additionalData: any,
    callbacks: ChatServiceCallbacks
  ): Promise<void> {
    try {
      const formData = new FormData();
      
      // Add files
      files.forEach((file, index) => {
        if (file.type.startsWith('audio/')) {
          formData.append('audio', file);
        } else {
          formData.append(`file_${index}`, file);
        }
      });

      // Add additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Build full URL  
      const url = this.apiService['buildUrl'](endpoint);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Authorization': 'Bearer dev_key_test'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await this.processStreamingResponse(response, callbacks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      callbacks.onError?.(new Error(`Multimodal streaming failed: ${errorMessage}`));
    }
  }

  /**
   * Process streaming response body
   */
  private async processStreamingResponse(
    response: Response,
    callbacks: ChatServiceCallbacks
  ): Promise<void> {
    if (!response.body) {
      callbacks.onError?.(new Error('No response body'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Accumulate complete message content for onMessageComplete callback
    let accumulatedContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            
            // Handle [DONE] marker
            if (dataContent === '[DONE]') {
              // Pass accumulated content to onMessageComplete
              callbacks.onMessageComplete?.(accumulatedContent);
              continue;
            }
            
            // Extract message content from message_stream events before passing to SSEParser
            try {
              const eventData = JSON.parse(dataContent);
              if (eventData.type === 'message_stream' && eventData.content?.raw_message) {
                let messageContent = eventData.content.raw_message;
                
                // Extract content from raw_message format: content="..." or content='...' additional_kwargs={} ...
                const contentMatch = messageContent.match(/content='([^']*(?:\\'[^']*)*)'|content="([^"]*(?:\\"[^"]*)*)"/);
                if (contentMatch) {
                  messageContent = contentMatch[1] || contentMatch[2]; // 单引号或双引号
                  // Unescape quotes
                  messageContent = messageContent.replace(/\\"/g, '"').replace(/\\'/g, "'");
                  console.log('📨 CHAT_SERVICE: Extracted content from raw_message:', messageContent.substring(0, 100) + '...');
                }
                
                // Only update if we have actual content (skip empty or tool calls)
                if (messageContent && messageContent.trim() && !messageContent.includes('tool_calls')) {
                  accumulatedContent = messageContent; // Use extracted content
                  console.log('📨 CHAT_SERVICE: Updated accumulated content:', messageContent.substring(0, 100) + '...');
                }
              }
            } catch (parseError) {
              // Continue with normal SSEParser processing for non-JSON data
            }
            
            // Parse and handle SSE event using SSEParser
            SSEParser.parseForChatService(dataContent, callbacks);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }


  // ================================================================================
  // Utility Methods
  // ================================================================================

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    this.apiService.cancelRequest();
    console.log('🛑 ChatService: All requests cancelled');
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string, type: 'Bearer' | 'API-Key' | 'Basic' = 'Bearer'): void {
    this.apiService.setAuthToken(token, type);
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.apiService.clearAuth();
  }
}

// ================================================================================
// Default Instance Export
// ================================================================================

// Using AI-dedicated BaseApiService instance
export const chatService = new ChatService();

export default chatService;