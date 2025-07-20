/**
 * Simple test to validate the streaming works
 */

async function simpleTest() {
  console.log('🧪 Simple streaming test...');
  
  try {
    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'hi',
        session_id: 'test_session',
        user_id: 'test_user',
        use_streaming: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let tokenCount = 0;
    let formattedContentStarted = false;
    let formattedContentBuffer = '';

    console.log('📡 Reading stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const dataContent = line.slice(6).trim();
          
          if (dataContent === '[DONE]') {
            console.log('🏁 Stream ended');
            break;
          }
          
          try {
            const eventData = JSON.parse(dataContent);
            
            // Look for response tokens
            if (eventData.type === 'custom_event' && 
                eventData.metadata?.raw_chunk?.response_token) {
              
              const token = eventData.metadata.raw_chunk.response_token.token;
              tokenCount++;
              
              console.log(`Token #${tokenCount}: ${JSON.stringify(token)}`);
              
              // Simple detection of formatted_content start
              if (token.includes('formatted_content') && !formattedContentStarted) {
                console.log('🎬 Started receiving formatted_content');
                formattedContentStarted = true;
              }
              
              // If we're in formatted content, try to extract it
              if (formattedContentStarted) {
                formattedContentBuffer += token;
                
                // Simple extraction - look for the text between quotes after formatted_content
                const match = formattedContentBuffer.match(/"formatted_content":\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                if (match) {
                  const content = match[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                  
                  console.log(`📝 Current formatted_content: "${content}"`);
                }
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    console.log(`✅ Test completed. Received ${tokenCount} tokens.`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test with timeout
const timeout = setTimeout(() => {
  console.log('⏰ Test timed out after 30 seconds');
  process.exit(1);
}, 30000);

simpleTest().then(() => {
  clearTimeout(timeout);
  process.exit(0);
});