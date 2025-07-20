/**
 * Test file to capture and analyze streaming events from the API
 * This will help us understand the actual event structure and fix the streaming logic
 */

const fs = require('fs');

async function testStreamingAPI() {
  const logFile = './streaming_events.log';
  const eventLog = [];

  console.log('🧪 Starting streaming API test...');
  
  try {
    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'what\'s the weather in newyork',
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
              content: eventData.content ? eventData.content.substring(0, 200) + (eventData.content.length > 200 ? '...' : '') : undefined,
              full_content: eventData.full_content ? eventData.full_content.substring(0, 200) + (eventData.full_content.length > 200 ? '...' : '') : undefined,
              metadata: eventData.metadata,
              raw: dataContent.length > 500 ? dataContent.substring(0, 500) + '...[TRUNCATED]' : dataContent
            };
            
            eventLog.push(logEntry);
            console.log(`📥 Event #${eventCount}: ${eventData.type}`, eventData.status ? `(${eventData.status})` : '');
            
            // Log key events with more detail
            if (eventData.type === 'content' || eventData.type === 'response_token' || eventData.type === 'token') {
              console.log(`   📝 Content preview: ${eventData.content ? eventData.content.substring(0, 100) + '...' : 'N/A'}`);
              if (eventData.full_content) {
                console.log(`   📄 Full content preview: ${eventData.full_content.substring(0, 100) + '...'}`);
              }
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
    
    // Print summary
    console.log('\n📈 Event Summary:');
    const eventTypes = {};
    eventLog.forEach(event => {
      const key = event.status ? `${event.type}:${event.status}` : event.type;
      eventTypes[key] = (eventTypes[key] || 0) + 1;
    });
    
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    // Analyze final content events
    console.log('\n🔍 Final Content Analysis:');
    const finalEvents = eventLog.filter(e => 
      e.type === 'content' || 
      (e.type === 'response_token' && e.status === 'completed') ||
      e.type === 'end'
    );
    
    finalEvents.forEach((event, index) => {
      console.log(`   Final Event #${index + 1}: ${event.type}${event.status ? ':' + event.status : ''}`);
      if (event.content) {
        console.log(`     Content: ${event.content}`);
      }
      if (event.full_content) {
        console.log(`     Full Content: ${event.full_content}`);
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
testStreamingAPI();