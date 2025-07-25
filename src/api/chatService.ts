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
import { SSEParser } from './SSEParser';

// ================================================================================
// ChatService Class
// ================================================================================

export class ChatService {
  private apiService: BaseApiService;

  constructor(apiService?: BaseApiService) {
    // Use provided or create dedicated AI service instance
    this.apiService = apiService || new BaseApiService(config.externalApis.aiServiceUrl);
  }

  // ================================================================================
  // Public Methods - Message Sending Interface
  // ================================================================================

  /**
   * Send text message
   */
  async sendMessage(
    content: string,
    callbacks: ChatServiceCallbacks,
    metadata: ChatMetadata = {}
  ): Promise<void> {
    await this.sendMultimodalMessage(content, [], callbacks, metadata);
  }

  /**
   * Send multimodal message (text + files)
   */
  async sendMultimodalMessage(
    content: string,
    files: File[] = [],
    callbacks: ChatServiceCallbacks,
    metadata: ChatMetadata = {}
  ): Promise<void> {
    try {
      const endpoint = '/api/chat';
      
      if (files.length === 0) {
        // Text-only message - use streaming fetch implementation
        await this.handleStreamingRequest(endpoint, {
          message: content,
          session_id: metadata.session_id || 'default',
          user_id: metadata.auth0_id || 'test_user',
          use_streaming: true,
          template_parameters: metadata.template_parameters
        }, callbacks);

      } else {
        // Multimodal message - use file upload with streaming
        const additionalData = {
          message: content,
          session_id: metadata.session_id || 'default',
          user_id: metadata.auth0_id || 'test_user',
          use_streaming: 'true',
          ...(metadata.template_parameters && { 
            template_parameters: JSON.stringify(metadata.template_parameters) 
          })
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
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
          'Cache-Control': 'no-cache'
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
              callbacks.onMessageComplete?.();
              continue;
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