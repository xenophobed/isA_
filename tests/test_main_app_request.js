/**
 * Test file to capture main app chat request and response
 */

const fs = require('fs');

async function testMainAppChat() {
  const logFile = './main_app_chat_events.log';
  const eventLog = [];

  console.log('💬 Starting main app chat test...');
  
  try {
    // Simple chat request like main app sends
    const requestPayload = {
      message: 'hi',
      session_id: 'test_session',
      user_id: 'test_user',
      use_streaming: true
      // No template_parameters, no metadata - just like main app chat
    };

    console.log('📤 Sending main app chat request:', JSON.stringify(requestPayload, null, 2));

    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let eventCount = 0;

    console.log('📡 Starting to read stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const dataContent = line.slice(6).trim();
          
          if (dataContent === '[DONE]') {
            console.log('🏁 Stream ended with [DONE] marker');
            eventLog.push({
              eventNumber: ++eventCount,
              timestamp: new Date().toISOString(),
              type: 'DONE_MARKER',
              raw: dataContent
            });
            continue;
          }
          
          try {
            const eventData = JSON.parse(dataContent);
            const logEntry = {
              eventNumber: ++eventCount,
              timestamp: new Date().toISOString(),
              type: eventData.type,
              status: eventData.status,
              content: eventData.content,
              full_content: eventData.full_content,
              metadata: eventData.metadata,
              // Check for streaming-related fields
              token: eventData.token,
              role: eventData.role,
              raw: dataContent.length > 500 ? dataContent.substring(0, 500) + '...[TRUNCATED]' : dataContent
            };
            
            eventLog.push(logEntry);
            console.log(`📥 Event #${eventCount}: ${eventData.type}`, eventData.status ? `(${eventData.status})` : '');
            
            // Log streaming token events
            if (eventData.type === 'token' || eventData.type === 'response_token' || eventData.token) {
              console.log(`   🔤 TOKEN: ${eventData.token || eventData.content || 'N/A'}`);
            }
            
            // Log final content
            if (eventData.type === 'content' || eventData.type === 'end') {
              console.log(`   📄 FINAL CONTENT: ${eventData.content ? eventData.content.substring(0, 200) + '...' : 'N/A'}`);
            }
            
          } catch (parseError) {
            const logEntry = {
              eventNumber: ++eventCount,
              timestamp: new Date().toISOString(),
              type: 'PARSE_ERROR',
              error: parseError.message,
              raw: dataContent.length > 500 ? dataContent.substring(0, 500) + '...[TRUNCATED]' : dataContent
            };
            eventLog.push(logEntry);
            console.log(`⚠️ Event #${eventCount}: Parse error - ${parseError.message}`);
          }
        }
      }
    }

    // Write detailed log to file
    fs.writeFileSync(logFile, JSON.stringify(eventLog, null, 2));
    console.log(`📊 Captured ${eventCount} events. Detailed log saved to: ${logFile}`);
    
    // Analyze streaming events
    console.log('\n🔤 Streaming Token Events:');
    const tokenEvents = eventLog.filter(e => 
      e.type === 'token' || 
      e.type === 'response_token' || 
      e.token ||
      (e.type === 'custom_event' && e.content && e.content.includes('token'))
    );
    
    tokenEvents.forEach((event, index) => {
      console.log(`   Token Event #${index + 1}: ${event.type}${event.status ? ':' + event.status : ''}`);
      if (event.token) {
        console.log(`     Token: ${event.token}`);
      }
      if (event.content && event.content.includes('token')) {
        console.log(`     Content: ${event.content.substring(0, 100)}...`);
      }
    });

    // Check final response format
    console.log('\n📝 Final Response Analysis:');
    const finalEvents = eventLog.filter(e => 
      e.type === 'content' || 
      e.type === 'end' ||
      e.full_content
    );
    
    finalEvents.forEach((event, index) => {
      console.log(`   Final Event #${index + 1}: ${event.type}${event.status ? ':' + event.status : ''}`);
      if (event.content) {
        console.log(`     Content Type: ${typeof event.content}`);
        console.log(`     Content Preview: ${event.content.substring(0, 200)}${event.content.length > 200 ? '...' : ''}`);
        
        // Check if it's JSON
        try {
          const parsed = JSON.parse(event.content);
          console.log(`     ✅ Valid JSON with keys: ${Object.keys(parsed).join(', ')}`);
          if (parsed.formatted_content) {
            console.log(`     📄 Formatted Content: ${parsed.formatted_content.substring(0, 100)}...`);
          }
        } catch (e) {
          console.log(`     ❌ Not JSON: ${e.message}`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    fs.writeFileSync(logFile, JSON.stringify(errorLog, null, 2));
  }
}

// Run the test
testMainAppChat();