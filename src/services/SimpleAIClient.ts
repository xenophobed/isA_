/**
 * Simple AI Client for main_app
 * Handles requests, streaming, and private routing
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sender?: string;
    app?: string;
    media_items?: Array<{
      type: string;
      url: string;
      title?: string;
    }>;
    [key: string]: any;
  };
}

type EventCallback = (data: any) => void;

export class SimpleAIClient {
  private apiEndpoint: string;
  private events: Map<string, EventCallback[]> = new Map();
  
  // State for content token extraction
  private previousFormattedLength: number = 0;

  constructor(apiEndpoint: string = 'http://localhost:8080') {
    this.apiEndpoint = apiEndpoint;
  }

  // Event system
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    
    // Return cleanup function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  private emit(event: string, data: any) {
    console.log(`🔥 SimpleAI: Emitting ${event}`, data);
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  // Send message (text only)
  async sendMessage(content: string, metadata: any = {}): Promise<string> {
    return this.sendMultimodalMessage(content, [], metadata);
  }

  // Send multimodal message with files
  async sendMultimodalMessage(content: string, files: File[] = [], metadata: any = {}): Promise<string> {
    const messageId = `user-${Date.now()}`;

    try {
      let response: Response;

      if (files.length === 0) {
        // Text-only request (JSON)
        response = await fetch(`${this.apiEndpoint}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            session_id: metadata.session_id || 'default',
            user_id: metadata.user_id || 'test_user',
            use_streaming: true,
            template_parameters: metadata.template_parameters
          })
        });
      } else {
        // Multimodal request (FormData)
        const formData = new FormData();
        formData.append('message', content);
        formData.append('session_id', metadata.session_id || 'default');
        formData.append('user_id', metadata.user_id || 'test_user');
        formData.append('use_streaming', 'true');

        // Add template parameters if provided
        if (metadata.template_parameters) {
          Object.entries(metadata.template_parameters).forEach(([key, value]) => {
            formData.append(`template_parameters[${key}]`, value as string);
          });
        }

        // Add files
        files.forEach((file, index) => {
          if (file.type.startsWith('audio/')) {
            formData.append('audio', file);
          } else {
            formData.append(`file_${index}`, file);
          }
        });

        console.log('🔄 SimpleAI: Sending multimodal request with', files.length, 'files');

        response = await fetch(`${this.apiEndpoint}/api/chat`, {
          method: 'POST',
          body: formData // No Content-Type header for FormData
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      await this.handleStreamingResponse(response, messageId, metadata);
      
      return messageId;
    } catch (error) {
      console.error('❌ SimpleAI: Request failed', error);
      throw error;
    }
  }

  private async handleStreamingResponse(response: Response, requestId: string, metadata: any = {}) {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedTokens = '';
    let hasStartedStreaming = false;
    let isReceivingTokens = false;
    
    // Reset token extraction state for new message
    this.previousFormattedLength = 0;

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
              console.log('🔚 SimpleAI: Stream ended with [DONE] marker');
              if (isReceivingTokens) {
                this.emit('streaming:end', { type: 'done' });
                this.emit('typing:changed', false);
              }
              continue;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              
              // Only handle key events, ignore most workflow events
              if (eventData.type === 'start') {
                console.log('🎬 SimpleAI: Stream session started');
                // Don't emit streaming:start yet, wait for actual tokens
              }
              
              // Handle response tokens (the actual streaming content)
              else if (eventData.type === 'custom_event' && 
                       eventData.metadata?.raw_chunk?.response_token) {
                
                const tokenData = eventData.metadata.raw_chunk.response_token;
                
                if (tokenData.token) {
                  accumulatedTokens += tokenData.token;
                  console.log('🔤 Token received:', JSON.stringify(tokenData.token));
                  
                  // Start streaming when we get past the JSON structure to actual content
                  if (!hasStartedStreaming && this.shouldStartStreaming(accumulatedTokens)) {
                    console.log('🎬 SimpleAI: Starting content streaming');
                    this.emit('streaming:start', { type: 'content_start' });
                    this.emit('typing:changed', true);
                    hasStartedStreaming = true;
                    isReceivingTokens = true;
                  }
                  
                  // Only process content tokens, not JSON structure
                  if (hasStartedStreaming) {
                    this.processContentToken(accumulatedTokens, tokenData.token);
                  }
                }
              }
              
              // Handle final content (shouldn't process if we streamed tokens)
              else if (eventData.type === 'content') {
                console.log('🏁 SimpleAI: Final content received');
                
                if (isReceivingTokens) {
                  console.log('✅ SimpleAI: Tokens were streamed, skipping final content processing');
                  this.emit('streaming:end', { type: 'content_complete' });
                  this.emit('typing:changed', false);
                } else {
                  // Fallback for non-streamed responses
                  console.log('📄 SimpleAI: No tokens were streamed, processing final content');
                  let actualContent = this.extractFormattedContent(eventData.content);
                  await this.processFinalResponse(actualContent, requestId, metadata);
                }
                
                // Reset state
                accumulatedTokens = '';
                hasStartedStreaming = false;
                isReceivingTokens = false;
              }
              
              // Handle end event
              else if (eventData.type === 'end') {
                console.log('🏁 SimpleAI: Stream session ended');
                if (isReceivingTokens) {
                  this.emit('streaming:end', { type: 'session_end' });
                  this.emit('typing:changed', false);
                }
              }
              
              // Handle node updates (workflow progress)
              else if (eventData.type === 'node_update') {
                const nodeName = eventData.metadata?.node_name;
                const nextAction = eventData.metadata?.next_action;
                
                // Only show meaningful workflow steps to user
                if (nodeName === 'entry_preparation' && nextAction === 'end') {
                  this.emit('streaming:status', { status: 'Processing request...', type: 'workflow', node: nodeName });
                } else if (nodeName === 'reasonnode' && nextAction === 'end') {
                  this.emit('streaming:status', { status: 'Generating response...', type: 'workflow', node: nodeName });
                } else if (nodeName === 'format_response' && nextAction === 'end') {
                  this.emit('streaming:status', { status: 'Finalizing...', type: 'workflow', node: nodeName });
                }
              }
              
              // Handle tool execution events (minimal status updates)
              else if (eventData.type === 'tool_executing') {
                const toolName = eventData.metadata?.tool_name || 'tool';
                this.emit('streaming:status', { status: `Executing ${toolName}...`, type: 'tool' });
              }
              else if (eventData.type === 'tool_completed') {
                const toolName = eventData.metadata?.tool_name || 'tool';
                this.emit('streaming:status', { status: `Completed ${toolName}`, type: 'tool', tool_name: toolName });
              }
              
              // Handle tool result messages (contains actual tool output)
              else if (eventData.type === 'tool_result_msg') {
                try {
                  // Extract the tool result from the content
                  const content = eventData.content || '';
                  console.log('🔧 SimpleAI: Raw tool result content:', content);
                  
                  // Try multiple patterns to extract JSON
                  let jsonString = null;
                  
                  // Pattern 1: ToolMessage: {...} with potential line breaks
                  let jsonMatch = content.match(/ToolMessage:\s*(\{[\s\S]*\})/);
                  if (jsonMatch) {
                    jsonString = jsonMatch[1];
                  } else {
                    // Pattern 2: Just look for JSON object
                    jsonMatch = content.match(/(\{[\s\S]*\})/);
                    if (jsonMatch) {
                      jsonString = jsonMatch[1];
                    }
                  }
                  if (jsonString) {
                    // Clean up common JSON issues caused by streaming
                    jsonString = jsonString
                      .replace(/\\n/g, '')  // Remove escaped newlines that break JSON
                      .replace(/\n/g, '')   // Remove actual newlines
                      .replace(/,\s*}/g, '}')  // Remove trailing commas
                      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                      .trim();
                    
                    console.log('🔧 SimpleAI: Cleaned JSON string:', jsonString.substring(0, 200) + '...');
                    
                    const toolResult = JSON.parse(jsonString);
                    
                    // Generic tool result handler for all tools
                    console.log(`🔧 SimpleAI: Tool result for ${toolResult.action}:`, toolResult);
                    
                    // Emit generic tool result event
                    this.emit('tool:result', {
                      action: toolResult.action,
                      status: toolResult.status,
                      data: toolResult.data || {},
                      success: toolResult.status === 'success'
                    });
                    
                    // Special handling for image URLs if present
                    if (toolResult.data?.image_urls && toolResult.data.image_urls.length > 0) {
                      console.log('🖼️ SimpleAI: Found image URLs:', toolResult.data.image_urls);
                      this.emit('tool:images_found', { 
                        urls: toolResult.data.image_urls,
                        action: toolResult.action,
                        data: toolResult.data
                      });
                    }
                  } else {
                    console.log('⚠️ SimpleAI: No JSON found in tool result message');
                  }
                } catch (e) {
                  console.log('⚠️ SimpleAI: Error parsing tool result message:', e);
                  console.log('⚠️ SimpleAI: Raw content was:', eventData.content);
                }
              }
              
            } catch (parseError) {
              console.log('⚠️ SimpleAI: Failed to parse event:', line, parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private shouldStartStreaming(accumulated: string): boolean {
    // Start streaming when we reach actual content after "User:" or "Assistant:"
    // This skips the JSON structure tokens and waits for readable content
    const patterns = [
      'User: ',
      'Assistant: '
    ];
    
    return patterns.some(pattern => accumulated.includes(pattern));
  }

  private processContentToken(accumulated: string, _newToken: string) {
    try {
      // Look for the actual content within the formatted_content field
      // We want to extract just the human-readable conversation, not the JSON structure
      
      // Find where actual conversation content starts and ends
      const userMatch = accumulated.match(/User: ([^\\]*)\\n\\nAssistant: ([^"]*)/);
      if (userMatch) {
        const assistantContent = userMatch[2];
        
        // Only emit new content that wasn't already sent
        if (assistantContent.length > this.previousFormattedLength) {
          const newContent = assistantContent.substring(this.previousFormattedLength);
          
          // Clean up escaped characters for display
          const cleanContent = newContent
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          if (cleanContent.length > 0) {
            console.log('🔤 SimpleAI: Emitting clean content:', JSON.stringify(cleanContent));
            this.emit('token:received', { content: cleanContent });
            this.previousFormattedLength = assistantContent.length;
          }
        }
      }
    } catch (e) {
      console.log('⚠️ SimpleAI: Error processing content token:', e);
    }
  }

  private async processFinalResponse(content: string, _requestId: string, metadata: any = {}) {
    try {
      // Check if we have any content to process
      if (!content.trim()) {
        console.log('⚠️ SimpleAI: No content to process in final response');
        return;
      }
      
      // Try to extract formatted_content if this is JSON wrapped
      let actualContent = this.extractFormattedContent(content);
      
      console.log('📦 SimpleAI: Processing content:', actualContent.substring(0, 200) + '...');
      
      // Extract image URLs and media items
      let media_items: any[] = [];
      
      // First, try to get media_items from the parsed JSON structure
      try {
        const parsedContent = JSON.parse(content);
        if (parsedContent.media_items && Array.isArray(parsedContent.media_items)) {
          media_items = parsedContent.media_items;
          console.log('🖼️ SimpleAI: Found media_items in parsed content:', media_items);
        }
      } catch (e) {
        // If not JSON, try to extract from markdown
        const imageUrls = this.extractImageUrls(actualContent);
        media_items = imageUrls.map(url => ({
          type: 'image',
          url: url,
          title: 'Generated Image'
        }));
      }
      
      // Use provided metadata directly
      const requestMetadata = metadata;
      
      // Create message with processed content
      const message: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: actualContent,
        timestamp: new Date().toISOString(),
        metadata: {
          ...requestMetadata,
          content_types: ['text'],
          has_media: media_items.length > 0,
          media_items: media_items
        }
      };

      console.log('💬 SimpleAI: Routing processed response to centralized store');
      console.log('🖼️ SimpleAI: Found', media_items.length, 'images in response');
      this.emit('message:received', message);
      
    } catch (parseError) {
      console.error('❌ SimpleAI: Failed to parse final response', parseError);
    }
  }

  private extractFormattedContent(content: string): string {
    try {
      // Try to parse as JSON first
      const parsedContent = JSON.parse(content);
      if (parsedContent.formatted_content) {
        console.log('✅ SimpleAI: Extracted formatted_content from JSON in processFinalResponse');
        return parsedContent.formatted_content;
      }
      
      // If it has formatted_content field but it's an object, try to stringify it
      if (typeof parsedContent.formatted_content === 'object') {
        return JSON.stringify(parsedContent.formatted_content, null, 2);
      }
      
      // Return the entire parsed content if no formatted_content field
      return typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent, null, 2);
      
    } catch (jsonError) {
      // Not JSON, return content as-is
      console.log('📄 SimpleAI: Content is not JSON in processFinalResponse, using as-is');
      return content;
    }
  }

  private extractImageUrls(content: string): string[] {
    const imageUrls: string[] = [];
    
    // Match markdown image format: ![alt](url)
    const markdownImages = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
    if (markdownImages) {
      markdownImages.forEach(match => {
        const urlMatch = match.match(/\((https?:\/\/[^\s)]+)\)/);
        if (urlMatch) {
          imageUrls.push(urlMatch[1]);
        }
      });
    }
    
    // Match direct image URLs
    const directUrls = content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/gi);
    if (directUrls) {
      directUrls.forEach(url => {
        if (!imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      });
    }
    
    console.log('🔍 SimpleAI: Extracted image URLs:', imageUrls);
    return imageUrls;
  }

}