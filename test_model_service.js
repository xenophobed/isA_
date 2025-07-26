// Simple test for modelService
const fetch = require('node-fetch');

async function testModelService() {
  console.log('🔧 Testing ModelService...');
  
  const messages = [
    {
      role: 'system',
      content: 'Analyze the intent of the user request and return only "1", "2", "3" or "none". 1=image generation, 2=web search, 3=content writing'
    },
    {
      role: 'user', 
      content: 'generate a cute cat image'
    }
  ];

  const args = {
    input_data: messages,
    task: 'chat',
    service_type: 'text'
  };

  try {
    console.log('📡 Calling http://localhost:8082/invoke...');
    
    const response = await fetch('http://localhost:8082/invoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(args)
    });

    console.log('📋 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Model API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    
    if (!result.success) {
      throw new Error(`Model call failed: ${result.error || 'Unknown error'}`);
    }

    console.log('🎯 Final content:', result.content);
    return result.content;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run test
testModelService()
  .then(content => {
    console.log('✅ ModelService test passed!');
    console.log('📝 Result:', content);
  })
  .catch(error => {
    console.error('❌ ModelService test failed:', error.message);
    process.exit(1);
  });