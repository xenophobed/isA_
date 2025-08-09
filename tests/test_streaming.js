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
        message: 'Search for the latest iPhone price and compare it with Samsung Galaxy prices, then analyze the price differences',
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
              content: eventData.content ? (typeof eventData.content === 'string' ? eventData.content.substring(0, 200) + (eventData.content.length > 200 ? '...' : '') : JSON.stringify(eventData.content).substring(0, 200)) : undefined,
              full_content: eventData.full_content ? (typeof eventData.full_content === 'string' ? eventData.full_content.substring(0, 200) + (eventData.full_content.length > 200 ? '...' : '') : JSON.stringify(eventData.full_content).substring(0, 200)) : undefined,
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
            // 🆕 NEW: Test task-related events (custom_stream and graph_update)
            else if (eventData.type === 'custom_stream') {
              console.log(`\n📋 ========== CUSTOM_STREAM EVENT ==========`);
              if (eventData.content?.task_state) {
                const taskState = eventData.content.task_state;
                console.log(`   📊 TASK STATE:`, JSON.stringify(taskState, null, 2));
                console.log(`   🎯 Current Task: ${taskState.current_task_name} (${taskState.current_task_index + 1}/${taskState.total_tasks})`);
                console.log(`   ✅ Completed: ${taskState.completed_tasks}/${taskState.total_tasks}`);
              } else if (eventData.content?.task_completed) {
                const taskCompleted = eventData.content.task_completed;
                console.log(`   ✅ TASK COMPLETED:`, JSON.stringify(taskCompleted, null, 2));
              } else if (eventData.content?.agent_execution) {
                const agentExecution = eventData.content.agent_execution;
                console.log(`   🤖 AGENT EXECUTION:`, JSON.stringify(agentExecution, null, 2));
              } else if (eventData.content?.custom_llm_chunk) {
                console.log(`   💬 LLM CHUNK: "${eventData.content.custom_llm_chunk}"`);
              } else if (eventData.content?.data && eventData.content?.type) {
                console.log(`   📈 PROGRESS: ${eventData.content.type} - ${eventData.content.data}`);
              }
              console.log(`==========================================\n`);
            } else if (eventData.type === 'graph_update') {
              console.log(`\n📊 ========== GRAPH_UPDATE EVENT ==========`);
              try {
                const graphData = JSON.parse(eventData.content);
                if (graphData.call_tool?.task_list) {
                  console.log(`   📋 CALL_TOOL TASK LIST:`, JSON.stringify(graphData.call_tool.task_list, null, 2));
                }
                if (graphData.agent_executor?.task_list) {
                  console.log(`   🤖 AGENT_EXECUTOR TASK LIST:`, JSON.stringify(graphData.agent_executor.task_list, null, 2));
                }
              } catch (parseErr) {
                console.log(`   📊 GRAPH DATA (raw): ${eventData.content}`);
              }
              console.log(`==========================================\n`);
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

    // 🆕 NEW: Analyze task-related events
    console.log('\n📋 ========== TASK EVENT ANALYSIS ==========');
    const taskEvents = eventLog.filter(e => 
      e.type === 'custom_stream' || 
      (e.type === 'graph_update' && e.raw && (e.raw.includes('task_list') || e.raw.includes('call_tool')))
    );
    
    if (taskEvents.length > 0) {
      console.log(`📊 Found ${taskEvents.length} task-related events:`);
      taskEvents.forEach((event, index) => {
        console.log(`\n--- Task Event #${index + 1}: ${event.type} ---`);
        console.log(`⏰ Time: ${event.timestamp}`);
        if (event.raw) {
          // Try to parse and extract task info
          try {
            const eventData = JSON.parse(event.raw);
            if (eventData.type === 'custom_stream' && eventData.content?.task_state) {
              const ts = eventData.content.task_state;
              console.log(`📊 Task State: ${ts.current_task_name} (${ts.completed_tasks}/${ts.total_tasks})`);
              if (ts.task_names) {
                console.log(`📝 Task List: ${ts.task_names.join(', ')}`);
              }
            } else if (eventData.type === 'graph_update') {
              const graphData = JSON.parse(eventData.content);
              if (graphData.call_tool?.task_list) {
                console.log(`📋 Call Tool Tasks: ${graphData.call_tool.task_list.length} tasks`);
                graphData.call_tool.task_list.forEach((task, i) => {
                  console.log(`   ${i + 1}. ${task.title}: ${task.description}`);
                });
              }
              if (graphData.agent_executor?.task_list) {
                console.log(`🤖 Agent Executor Tasks: ${graphData.agent_executor.task_list.length} tasks`);
                graphData.agent_executor.task_list.forEach((task, i) => {
                  console.log(`   ${i + 1}. ${task.title}: ${task.description}`);
                });
              }
            }
          } catch (parseErr) {
            console.log(`⚠️ Could not parse task event details`);
          }
        }
      });
    } else {
      console.log('❌ No task-related events found in this stream.');
      console.log('💡 This means the API is not yet sending autonomous task execution data.');
    }
    
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