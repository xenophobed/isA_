// Test AI intent detection
const fetch = require('node-fetch');

async function testIntent() {
  console.log('🔧 Testing AI Intent Detection...');
  
  const prompt = `Analyze the intent of this user request and return only one of these exact widget names:
- dream: for image generation, drawing, create pictures
- hunt: for web search, product search, find items
- omni: for content writing, text generation
- assistant: for general help, questions
- data-scientist: for data analysis, charts, statistics
- knowledge: for document analysis (but user has no files)
- none: for unclear intent

User request: "write a copy of a famous history event"

Return only one word: dream, hunt, omni, assistant, data-scientist, knowledge, or none`;

  try {
    const response = await fetch('http://localhost:8082/api/v1/invoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_data: prompt,
        task: 'chat',
        service_type: 'text',
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Full response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('🎯 AI Result:', result.result?.content);
      const intent = result.result?.content?.trim()?.toLowerCase();
      console.log('🎯 Processed intent:', intent);
      
      const validWidgets = ['dream', 'hunt', 'omni', 'assistant', 'data-scientist', 'knowledge'];
      if (validWidgets.includes(intent)) {
        console.log('✅ Valid widget detected:', intent);
      } else {
        console.log('❌ Invalid or no widget detected:', intent);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIntent();