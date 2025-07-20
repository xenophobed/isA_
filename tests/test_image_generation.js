/**
 * Test file to capture and analyze image generation responses from the API
 * This will help us understand how Dream sidebar should handle responses
 */

const fs = require('fs');

async function testImageGenerationAPI() {
  const logFile = './image_generation_events.log';
  const eventLog = [];

  console.log('🎨 Starting image generation API test...');
  
  try {
    // Test with the same format as Dream sidebar sends
    const requestPayload = {
      message: 'generate a image of a cute kid',
      session_id: 'test_session',
      user_id: 'test_user',
      use_streaming: true,
      template_parameters: {
        app_id: "dream",
        template_id: "text_to_image_prompt",
        prompt_args: {
          prompt: 'generate a image of a cute kid',
          input_image: null,
          quality: 'high',
          style_preset: 'auto',
          mode: 'text_to_image'
        }
      },
      metadata: {
        sender: 'atomic-image-app',
        app: 'dream', 
        requestId: 'test-image-generation',
        processing_mode: 'text_to_image',
        estimated_time: '10-15 seconds',
        estimated_cost: '$3/1000 images'
      }
    };

    console.log('📤 Sending request:', JSON.stringify(requestPayload, null, 2));

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
              // Check for image-specific fields
              media_items: eventData.metadata?.media_items,
              sender: eventData.metadata?.sender,
              raw: dataContent.length > 1000 ? dataContent.substring(0, 1000) + '...[TRUNCATED]' : dataContent
            };
            
            eventLog.push(logEntry);
            console.log(`📥 Event #${eventCount}: ${eventData.type}`, eventData.status ? `(${eventData.status})` : '');
            
            // Log sender information
            if (eventData.metadata?.sender) {
              console.log(`   👤 Sender: ${eventData.metadata.sender}`);
            }
            
            // Log media items (images)
            if (eventData.metadata?.media_items) {
              console.log(`   🖼️ Media items found: ${eventData.metadata.media_items.length}`);
              eventData.metadata.media_items.forEach((item, index) => {
                console.log(`     Item #${index + 1}: ${item.type} - ${item.url ? item.url.substring(0, 100) + '...' : 'No URL'}`);
              });
            }
            
            // Log content preview
            if (eventData.content) {
              console.log(`   📝 Content preview: ${eventData.content.substring(0, 200)}${eventData.content.length > 200 ? '...' : ''}`);
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

    // Analyze image-related events
    console.log('\n🖼️ Image-Related Events:');
    const imageEvents = eventLog.filter(e => 
      e.media_items || 
      e.sender === 'atomic-image-app' ||
      (e.content && e.content.toLowerCase().includes('image'))
    );
    
    imageEvents.forEach((event, index) => {
      console.log(`   Image Event #${index + 1}: ${event.type}${event.status ? ':' + event.status : ''}`);
      if (event.sender) {
        console.log(`     Sender: ${event.sender}`);
      }
      if (event.media_items) {
        console.log(`     Media Items: ${JSON.stringify(event.media_items, null, 4)}`);
      }
    });

    // Check final response for image URL
    console.log('\n🔍 Final Response Analysis:');
    const finalEvents = eventLog.filter(e => 
      e.type === 'end' || 
      e.status === 'completed' || 
      e.media_items
    );
    
    finalEvents.forEach((event, index) => {
      console.log(`   Final Event #${index + 1}: ${event.type}${event.status ? ':' + event.status : ''}`);
      if (event.media_items) {
        console.log(`     🎯 FOUND IMAGE URLS!`);
        event.media_items.forEach((item, i) => {
          console.log(`       ${item.type}: ${item.url}`);
        });
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
testImageGenerationAPI();