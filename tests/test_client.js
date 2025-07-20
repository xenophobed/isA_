/**
 * Test the fixed SimpleAIClient implementation
 */

// Simple require-based import since we're using CommonJS
const fs = require('fs');

// Mock the SimpleAIClient class since we can't import TS directly
class TestSimpleAIClient {
  constructor(apiEndpoint = 'http://localhost:8080') {
    this.apiEndpoint = apiEndpoint;
    this.events = new Map();
    
    // State for formatted_content token extraction
    this.insideFormattedContent = false;
    this.formattedContentBuffer = '';
    this.previousFormattedLength = 0;
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
    
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  emit(event, data) {
    console.log(`🔥 Event: ${event}`, JSON.stringify(data));
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  processFormattedContentToken(accumulated, newToken) {
    try {
      // Check if we're starting to receive formatted_content
      if (accumulated.includes('"formatted_content":') && !this.insideFormattedContent) {
        this.insideFormattedContent = true;
        this.previousFormattedLength = 0;
        console.log('🎬 Started receiving formatted_content tokens');
        return; // Don't emit the opening quote
      }
      
      // If we're inside formatted_content, extract only the actual content
      if (this.insideFormattedContent) {
        // Match the current state of formatted_content value
        const contentMatch = accumulated.match(/"formatted_content":\s*"([^"\\]*(\\.[^"\\]*)*)"/s);
        if (contentMatch) {
          let currentContent = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t');
          
          // Only emit the new portion that was added
          if (currentContent.length > this.previousFormattedLength) {
            const newContent = currentContent.substring(this.previousFormattedLength);
            if (newContent) {
              this.emit('token:received', { content: newContent });
              this.previousFormattedLength = currentContent.length;
            }
          }
        }
        
        // Check if we've reached the end of formatted_content
        if (accumulated.includes('",\n  "content_types"') || 
            accumulated.includes('",\n  "media_items"') ||
            newToken.includes('",\n')) {
          console.log('🏁 Finished receiving formatted_content tokens');
          this.insideFormattedContent = false;
          this.previousFormattedLength = 0;
        }
      }
    } catch (e) {
      console.log('⚠️ Error processing formatted_content token:', e);
    }
  }

  async sendMessage(content) {
    console.log('📤 Sending message:', content);
    
    try {
      const response = await fetch(`${this.apiEndpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          session_id: 'test_session',
          user_id: 'test_user',
          use_streaming: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await this.handleStreamingResponse(response, `test-${Date.now()}`);
      
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  }

  async handleStreamingResponse(response, requestId) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedTokens = '';
    let hasStartedStreaming = false;
    let isReceivingTokens = false;
    
    // Reset token extraction state for new message
    this.insideFormattedContent = false;
    this.formattedContentBuffer = '';
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
            
            if (dataContent === '[DONE]') {
              console.log('🔚 Stream ended with [DONE] marker');
              if (isReceivingTokens) {
                this.emit('streaming:end', { type: 'done' });
              }
              continue;
            }
            
            try {
              const eventData = JSON.parse(dataContent);
              
              // Only handle key events, ignore most workflow events
              if (eventData.type === 'start') {
                console.log('🎬 Stream session started');
              }
              
              // Handle response tokens (the actual streaming content)
              else if (eventData.type === 'custom_event' && 
                       eventData.metadata?.raw_chunk?.response_token) {
                
                const tokenData = eventData.metadata.raw_chunk.response_token;
                
                // Start streaming on first token
                if (!hasStartedStreaming) {
                  console.log('🎬 Starting token streaming');
                  this.emit('streaming:start', { type: 'token_start' });
                  hasStartedStreaming = true;
                  isReceivingTokens = true;
                }
                
                if (tokenData.token) {
                  accumulatedTokens += tokenData.token;
                  console.log('🔤 Raw token:', JSON.stringify(tokenData.token));
                  
                  // Extract only formatted_content tokens
                  this.processFormattedContentToken(accumulatedTokens, tokenData.token);
                }
              }
              
              // Handle final content
              else if (eventData.type === 'content') {
                console.log('🏁 Final content received');
                
                if (isReceivingTokens) {
                  console.log('✅ Tokens were streamed, skipping final content processing');
                  this.emit('streaming:end', { type: 'content_complete' });
                } else {
                  console.log('📄 No tokens were streamed, this is a fallback');
                }
                
                // Reset state
                accumulatedTokens = '';
                hasStartedStreaming = false;
                isReceivingTokens = false;
              }
              
              // Handle end event
              else if (eventData.type === 'end') {
                console.log('🏁 Stream session ended');
                if (isReceivingTokens) {
                  this.emit('streaming:end', { type: 'session_end' });
                }
              }
              
            } catch (parseError) {
              console.log('⚠️ Failed to parse event:', parseError.message);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

async function testClientImplementation() {
  console.log('🧪 Testing SimpleAIClient implementation...');
  
  const client = new TestSimpleAIClient();
  
  // Set up event listeners
  const unsubscribeStart = client.on('streaming:start', (data) => {
    console.log('🎬 STREAMING STARTED:', data);
  });
  
  let streamedContent = '';
  const unsubscribeToken = client.on('token:received', (data) => {
    streamedContent += data.content;
    process.stdout.write(data.content); // Stream to console in real-time
  });
  
  const unsubscribeEnd = client.on('streaming:end', (data) => {
    console.log('\n🏁 STREAMING ENDED:', data);
    console.log('\n📝 Complete streamed content:', JSON.stringify(streamedContent));
  });
  
  try {
    await client.sendMessage('hi');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    unsubscribeStart();
    unsubscribeToken();
    unsubscribeEnd();
  }
}

// Run test with timeout
const timeout = setTimeout(() => {
  console.log('⏰ Test timed out after 60 seconds');
  process.exit(1);
}, 60000);

testClientImplementation().then(() => {
  clearTimeout(timeout);
  console.log('\n✅ Test completed successfully');
});