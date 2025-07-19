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

  // Send message
  async sendMessage(content: string, metadata: any = {}): Promise<string> {
    const messageId = `user-${Date.now()}`;

    try {
      const response = await fetch(`${this.apiEndpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          metadata
        })
      });

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
    let accumulatedContent = '';
    let isStreaming = false;

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
              continue;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              
              // Log all events to understand the full structure
              console.log('📥 SimpleAI: Event received:', eventData.type, eventData);
              
              // Debug: Check if we're missing the start event
              if (eventData.type === 'start') {
                console.log('🎬 SimpleAI: START EVENT DETECTED - should trigger streaming');
              }
              
              // Handle start event
              if (eventData.type === 'start') {
                console.log('🎬 SimpleAI: Streaming started');
                this.emit('streaming:start', eventData);
                this.emit('typing:changed', true);
                isStreaming = true;
              }
              
              // Handle status events (if any)
              else if (eventData.type === 'status' || eventData.type === 'progress') {
                console.log('📊 SimpleAI: Status update:', eventData);
                this.emit('streaming:status', eventData);
              }
              
              // Handle individual token streaming from custom_event
              else if (eventData.type === 'custom_event' && eventData.content?.includes('response_token')) {
                try {
                  // Extract token info from the custom event content
                  const tokenMatch = eventData.content.match(/'response_token':\s*{[^}]*'token':\s*'([^']*)'[^}]*}/);
                  if (tokenMatch) {
                    const token = tokenMatch[1];
                    if (!isStreaming) {
                      isStreaming = true;
                      this.emit('streaming:start', { type: 'custom_token_start' });
                      this.emit('typing:changed', true);
                    }
                    
                    // Emit individual token
                    this.emit('token:received', { content: token });
                    console.log('🔤 SimpleAI: Token received:', token);
                  }
                } catch (e) {
                  // Ignore token extraction errors
                }
              }
              
              // Handle final content response
              else if (eventData.type === 'content') {
                console.log('🏁 SimpleAI: Final content received, processing response');
                this.emit('streaming:end', { type: 'content_complete' });
                this.emit('typing:changed', false);
                
                // Process final response
                await this.processFinalResponse(eventData.content, requestId, metadata);
                
                // Reset for next message
                accumulatedContent = '';
                isStreaming = false;
              }
              
              // Legacy token format (keep for compatibility)
              else if (eventData.type === 'token') {
                if (!isStreaming) {
                  isStreaming = true;
                  this.emit('typing:changed', true);
                }
                
                // Accumulate for final processing
                accumulatedContent += eventData.content;
                console.log('📝 SimpleAI: Accumulated content length:', accumulatedContent.length);
                
                // Extract and emit clean content tokens (not JSON)
                this.extractAndEmitCleanToken(accumulatedContent, eventData.content);
              }
              
              // Legacy end format (keep for compatibility)
              else if (eventData.type === 'end') {
                console.log('🏁 SimpleAI: End event received, processing final response');
                this.emit('streaming:end', { type: 'legacy_end' });
                this.emit('typing:changed', false);
                
                // Process final response
                await this.processFinalResponse(accumulatedContent, requestId, metadata);
                
                // Reset for next message
                accumulatedContent = '';
                isStreaming = false;
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

  private extractAndEmitCleanToken(accumulated: string, newToken: string) {
    // Only emit tokens if we're in the formatted_content section
    if (accumulated.includes('"formatted_content"')) {
      try {
        const match = accumulated.match(/"formatted_content":\s*"([^"\\]*(\\.[^"\\]*)*)"/);
        if (match) {
          const currentContent = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          // Calculate what new content this token adds
          const prevAccumulated = accumulated.substring(0, accumulated.lastIndexOf(newToken));
          const prevMatch = prevAccumulated.match(/"formatted_content":\s*"([^"\\]*(\\.[^"\\]*)*)"/);
          const prevContent = prevMatch ? 
            prevMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : '';
          
          if (currentContent.length > prevContent.length) {
            const newContent = currentContent.substring(prevContent.length);
            if (newContent.trim()) {
              this.emit('token:received', { content: newContent });
            }
          }
        }
      } catch (e) {
        // Ignore extraction errors
      }
    }
  }

  private async processFinalResponse(content: string, requestId: string, metadata: any = {}) {
    try {
      // Check if we have any content to process
      if (!content.trim()) {
        console.log('⚠️ SimpleAI: No content to process in final response');
        return;
      }
      
      // Parse the complete JSON response
      let jsonContent = content;
      
      // Remove markdown wrapper if present
      if (jsonContent.startsWith('```json')) {
        const match = jsonContent.match(/```json\n([\s\S]*?)\n```/);
        if (match) jsonContent = match[1];
      }
      
      // Try to parse the JSON
      let responseData;
      try {
        responseData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.log('⚠️ SimpleAI: Could not parse as JSON, using raw content:', jsonContent.substring(0, 200));
        // Create a fallback response
        responseData = {
          formatted_content: content,
          content_types: ['text'],
          has_media: false,
          media_items: []
        };
      }
      console.log('📦 SimpleAI: Parsed final response', responseData);
      
      // Use provided metadata directly
      const requestMetadata = metadata;
      
      // Create message
      const message: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: this.extractCleanContent(responseData.formatted_content) || responseData.formatted_content || '',
        timestamp: new Date().toISOString(),
        metadata: {
          ...requestMetadata,
          content_types: responseData.content_types || ['text'],
          has_media: responseData.has_media || false,
          media_items: responseData.media_items || []
        }
      };

      // All responses go to centralized store via message:received event
      console.log('💬 SimpleAI: Routing response to centralized store');
      this.emit('message:received', message);
      
    } catch (parseError) {
      console.error('❌ SimpleAI: Failed to parse final response', parseError);
    }
  }

  private extractCleanContent(formattedContent: string): string {
    try {
      // Check if content starts with ```json and ends with ```
      if (formattedContent.startsWith('```json') && formattedContent.includes('```')) {
        const jsonStart = formattedContent.indexOf('```json\n') + 8;
        const jsonEnd = formattedContent.lastIndexOf('\n```');
        const jsonStr = formattedContent.substring(jsonStart, jsonEnd);
        
        const parsed = JSON.parse(jsonStr);
        
        // Extract the actual text content, excluding image URLs and technical parts
        let cleanText = '';
        if (parsed.formatted_content) {
          // Remove image URLs and technical content, keep only human-readable text
          cleanText = parsed.formatted_content
            .replace(/https:\/\/[^\s]+/g, '') // Remove URLs
            .replace(/\\n/g, '\n') // Convert escaped newlines
            .replace(/\\"/g, '"') // Convert escaped quotes
            .trim();
        }
        
        return cleanText || 'Hello! How can I assist you today?';
      }
      
      return formattedContent;
    } catch (error) {
      console.log('⚠️ Failed to extract clean content, using original:', error);
      return formattedContent;
    }
  }
}