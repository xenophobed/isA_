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
            
            // Log key events with more detail - SHOW FULL CONTENT
            if (eventData.type === 'content') {
              console.log(`\n📄 ========== FINAL CONTENT EVENT ==========`);
              console.log(`   📝 FULL CONTENT:\n${eventData.content || 'N/A'}`);
              if (eventData.full_content) {
                console.log(`   📄 FULL_CONTENT FIELD:\n${eventData.full_content}`);
              }
              console.log(`   🔧 METADATA:`, JSON.stringify(eventData.metadata, null, 2));
              console.log(`   🔗 RAW EVENT DATA:`, JSON.stringify(eventData, null, 2));
              console.log(`========================================\n`);
            } else if (eventData.type === 'custom_event' && eventData.metadata?.raw_chunk?.response_batch) {
              const batch = eventData.metadata.raw_chunk.response_batch;
              console.log(`   🚀 Batch: "${batch.tokens}" (${batch.start_index}-${batch.start_index + batch.count}, total: ${batch.total_index})`);
            } else if (eventData.type === 'custom_event' && eventData.metadata?.raw_chunk?.response_token) {
              const token = eventData.metadata.raw_chunk.response_token;
              if (token.status === 'completed') {
                console.log(`   ✅ Streaming completed - Total tokens: ${token.total_tokens}`);
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

    // Show COMPLETE ACCUMULATED STREAMING CONTENT
    console.log('\n🔄 ========== ACCUMULATED STREAMING ANALYSIS ==========');
    const batchEvents = eventLog.filter(e => 
      e.type === 'custom_event' && 
      e.metadata?.raw_chunk?.response_batch?.status === 'streaming'
    );
    
    if (batchEvents.length > 0) {
      let streamedContent = '';
      batchEvents.forEach(event => {
        const batch = event.metadata.raw_chunk.response_batch;
        streamedContent += batch.tokens;
      });
      console.log(`📝 COMPLETE STREAMED CONTENT (${streamedContent.length} chars):`);
      console.log(`"${streamedContent}"`);
    }

    // Analyze final content events  
    console.log('\n🔍 ========== FINAL CONTENT ANALYSIS ==========');
    const finalEvents = eventLog.filter(e => 
      e.type === 'content' || 
      (e.type === 'custom_event' && e.metadata?.raw_chunk?.response_token?.status === 'completed') ||
      e.type === 'end'
    );
    
    finalEvents.forEach((event, index) => {
      console.log(`\n--- Final Event #${index + 1}: ${event.type}${event.status ? ':' + event.status : ''} ---`);
      
      if (event.type === 'content') {
        console.log(`📄 COMPLETE FINAL CONTENT:`);
        console.log(`"${event.content || 'N/A'}"`);
        
        if (event.metadata) {
          console.log(`🔧 METADATA:`, JSON.stringify(event.metadata, null, 2));
        }
      } else if (event.content) {
        console.log(`📝 Content: ${event.content}`);
      }
    });
    
    console.log('===============================================\n');

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