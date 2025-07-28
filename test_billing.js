/**
 * Test script to verify billing event handling
 */

async function testBillingEvents() {
  console.log('🧪 Testing billing event processing...');
  
  try {
    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev_key_test',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        message: 'Hello, test billing events',
        user_id: 'test_user_billing',
        session_id: 'test_session_billing'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Request sent successfully, processing stream...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let foundBillingEvent = false;
    let eventCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          eventCount++;
          const dataContent = line.slice(6).trim();
          
          try {
            const eventData = JSON.parse(dataContent);
            console.log(`📨 Event ${eventCount}: ${eventData.type}`);
            
            if (eventData.type === 'billing') {
              foundBillingEvent = true;
              console.log('💰 BILLING EVENT FOUND:', JSON.stringify(eventData, null, 2));
              
              // Check required billing data structure
              if (eventData.data && eventData.data.credits_remaining !== undefined) {
                console.log('✅ Billing data structure is correct');
                console.log(`   Credits remaining: ${eventData.data.credits_remaining}`);
                console.log(`   Model calls: ${eventData.data.model_calls || 0}`);
                console.log(`   Tool calls: ${eventData.data.tool_calls || 0}`);
              } else {
                console.log('❌ Billing data structure is missing required fields');
              }
            }
            
            // Stop after finding billing event or after reasonable number of events
            if (foundBillingEvent || eventCount > 20) {
              break;
            }
            
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
      
      if (foundBillingEvent || eventCount > 20) {
        break;
      }
    }
    
    reader.releaseLock();
    
    console.log(`\n📊 Test Results:`);
    console.log(`   Total events processed: ${eventCount}`);
    console.log(`   Billing event found: ${foundBillingEvent ? '✅ YES' : '❌ NO'}`);
    
    if (!foundBillingEvent) {
      console.log('ℹ️  Note: Billing event might come later in the stream or API might not be configured to send billing events');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBillingEvents().then(() => {
  console.log('🏁 Test completed');
}).catch(error => {
  console.error('💥 Test error:', error);
});