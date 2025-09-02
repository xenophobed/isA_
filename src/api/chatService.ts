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
// New Architecture Imports (Optional/Feature-flagged)
// ================================================================================
import { chatServiceNew } from './ChatServiceNew';

// ================================================================================
// ChatService Class
// ================================================================================

export class ChatService {
  private apiService: BaseApiService;
  
  // ================================================================================
  // New Architecture Feature Flag
  // ================================================================================
  private useNewArchitecture: boolean = process.env.NODE_ENV === 'development';

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
    // ================================================================================
    // New Architecture Integration
    // ================================================================================
    if (this.useNewArchitecture) {
      const payload = {
        message,
        user_id: metadata.user_id,
        session_id: metadata.session_id || 'default',
        prompt_name: metadata.prompt_name || null,
        prompt_args: metadata.prompt_args || {}
      };
      
      const url = `${config.api.baseUrl}/api/chat`;
      
      try {
        return await chatServiceNew.sendMessageWithNewArchitecture(url, payload, callbacks as any, token);
      } catch (error) {
        console.warn('🔄 NEW_ARCHITECTURE: Failed, falling back to legacy:', error);
        // Fall through to legacy implementation
      }
    }
    
    // ================================================================================
    // Legacy Architecture Implementation
    // ================================================================================
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

      // Check if user is authenticated - this should NEVER be empty
      const userId = metadata.user_id;
      if (!userId) {
        throw new Error('CHAT_SERVICE: No user_id provided. User must be authenticated before sending messages.');
      }

      // Prepare request body
      const requestBody = JSON.stringify({
        message,
        user_id: userId,
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
    // ================================================================================
    // New Architecture Integration
    // ================================================================================
    if (this.useNewArchitecture) {
      const payload = {
        message: content,
        user_id: metadata.user_id || metadata.auth0_id,
        session_id: metadata.session_id || 'default',
        prompt_name: metadata.prompt_name || null,
        prompt_args: metadata.prompt_args || {},
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      };
      
      const url = `${config.api.baseUrl}/api/chat`;
      
      try {
        return await chatServiceNew.sendMultimodalMessageWithNewArchitecture(url, payload, callbacks as any, token);
      } catch (error) {
        console.warn('🔄 NEW_ARCHITECTURE: Multimodal failed, falling back to legacy:', error);
        // Fall through to legacy implementation
      }
    }
    
    // ================================================================================
    // Legacy Architecture Implementation
    // ================================================================================
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
        // Multimodal message - use multimodal API endpoint for voice transcription support
        const multimodalEndpoint = '/api/chat/multimodal';
        
        // Check if we have audio files for voice processing
        const hasAudioFiles = files.some(file => file.type.startsWith('audio/'));
        
        const additionalData = {
          message: content,
          user_id: metadata.auth0_id || metadata.user_id || 'test_user',
          session_id: metadata.session_id || 'default',
          prompt_name: metadata.template_parameters?.template_id || null,
          prompt_args: JSON.stringify(metadata.template_parameters?.prompt_args || {}),
          // Add intelligent mode settings if available
          proactive_enabled: metadata.intelligentMode?.mode === 'proactive' ? 'true' : 'false',
          collaborative_enabled: metadata.intelligentMode?.mode === 'collaborative' || metadata.intelligentMode?.mode === 'proactive' ? 'true' : 'false',
          confidence_threshold: metadata.intelligentMode?.confidence_threshold?.toString() || '0.7'
        };

        console.log('🎤 CHAT_SERVICE: Using multimodal endpoint for files', {
          endpoint: multimodalEndpoint,
          hasAudioFiles,
          fileTypes: files.map(f => f.type),
          intelligentMode: metadata.intelligentMode
        });

        await this.handleMultimodalStreamingRequest(multimodalEndpoint, files, additionalData, callbacks);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      callbacks.onError?.(new Error(`ChatService: ${errorMessage}`));
    }
  }

  /**
   * Resume a chat session after HIL interrupt (based on actual 2025-08-16 tested API)
   * @param sessionId - The session ID to resume
   * @param userId - User ID 
   * @param resumeValue - The user's response to the HIL interrupt
   * @param token - Authentication token
   * @param callbacks - Event callbacks for handling streaming responses
   */
  async resumeChat(
    sessionId: string,
    userId: string,
    resumeValue: any,
    token: string,
    callbacks: SSEParserCallbacks
  ): Promise<void> {
    // ================================================================================
    // New Architecture Integration
    // ================================================================================
    if (this.useNewArchitecture) {
      const payload = {
        session_id: sessionId,
        user_id: userId,
        resume_value: resumeValue
      };
      
      const url = `${config.api.baseUrl}/api/chat/resume/${sessionId}`;
      
      try {
        return await chatServiceNew.resumeHILWithNewArchitecture(url, payload, callbacks as any, token);
      } catch (error) {
        console.warn('🔄 NEW_ARCHITECTURE: HIL resume failed, falling back to legacy:', error);
        // Fall through to legacy implementation
      }
    }
    
    // ================================================================================
    // Legacy Architecture Implementation
    // ================================================================================
    const startTime = Date.now();
    
    try {
      logger.info(LogCategory.CHAT_FLOW, 'Starting chat resume request', {
        sessionId,
        userId,
        resumeValueType: typeof resumeValue
      });

      // Prepare request body based on actual tested API format
      const requestBody = JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        resume_value: resumeValue
      });

      const url = `${config.api.baseUrl}/api/chat/resume`;
      
      console.log('🔄 CHAT_SERVICE: HIL Resume request details:');
      console.log('  URL:', url);
      console.log('  Method: POST');
      console.log('  Headers:', {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });
      console.log('  Body:', requestBody);
      
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

      console.log('🔄 CHAT_SERVICE: Resume response status:', response.status);
      console.log('🔄 CHAT_SERVICE: Resume response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔄 CHAT_SERVICE: Resume error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      // Process the streaming response with special handling for resume events
      await this.processResumeStreamingResponse(response, callbacks, sessionId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(LogCategory.CHAT_FLOW, 'Chat resume failed', { error: errorMessage, sessionId });
      callbacks.onError?.(new Error(`ChatService Resume: ${errorMessage}`));
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
    callbacks: SSEParserCallbacks
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
              callbacks.onStreamComplete?.();
              continue;
            }
            
            // Parse and handle SSE event using SSEParser (恢复简洁的架构)
            SSEParser.parseSSEEvent(dataContent, callbacks);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process streaming response specifically for HIL resume operations
   * Handles special resume event types based on actual 2025-08-16 test data
   */
  private async processResumeStreamingResponse(
    response: Response,
    callbacks: SSEParserCallbacks,
    sessionId: string
  ): Promise<void> {
    if (!response.body) {
      callbacks.onError?.(new Error('No response body for resume'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      let resumeStarted = false;
      
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
              callbacks.onStreamComplete?.();
              continue;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              
              // Handle special resume event types based on actual API responses
              if (eventData.type === 'resume_start') {
                resumeStarted = true;
                callbacks.onStreamStatus?.('🔄 Resuming execution...');
                console.log('🔄 CHAT_SERVICE: Resume started for session:', eventData.session_id);
                continue;
              }
              
              if (eventData.type === 'resume_end') {
                callbacks.onStreamStatus?.('✅ Resume completed');
                console.log('🔄 CHAT_SERVICE: Resume completed for session:', eventData.session_id);
                continue;
              }
              
              // Mark events as resumed for proper handling
              if (resumeStarted && eventData.session_id === sessionId) {
                eventData.resumed = true;
              }
              
              // Parse using standard SSEParser with resume context
              SSEParser.parseSSEEvent(dataContent, callbacks);
              
            } catch (parseError) {
              console.warn('🔄 CHAT_SERVICE: Failed to parse resume event:', parseError);
              // Fallback to standard parsing
              SSEParser.parseSSEEvent(dataContent, callbacks);
            }
          }
        }
      }
    } catch (error) {
      console.error('🔄 CHAT_SERVICE: Resume streaming error:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      reader.releaseLock();
    }
  }

  // ================================================================================
  // Utility Methods
  // ================================================================================

  /**
   * Get execution status for a session/thread (based on actual 2025-08-16 tested API)
   * @param sessionId - The session ID to check status for
   * @param token - Authentication token
   * @returns Promise with execution status data
   */
  async getExecutionStatus(sessionId: string, token: string): Promise<any> {
    try {
      const url = `${config.api.baseUrl}/api/execution/status/${sessionId}`;
      
      console.log('📊 CHAT_SERVICE: Getting execution status for session:', sessionId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const statusData = await response.json();
      
      console.log('📊 CHAT_SERVICE: Execution status received:', statusData);
      logger.info(LogCategory.CHAT_FLOW, 'Execution status retrieved', {
        sessionId,
        status: statusData.status,
        currentNode: statusData.current_node,
        checkpoints: statusData.checkpoints
      });
      
      return statusData;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(LogCategory.CHAT_FLOW, 'Failed to get execution status', { 
        error: errorMessage,
        sessionId
      });
      throw new Error(`ChatService Status: ${errorMessage}`);
    }
  }

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