/**
 * Session API 测试脚本
 * 
 * 基于 @reference/how_to_session.md 但使用真实的Auth0 token
 * 测试我们更新后的Session API集成
 */

const config = {
  SESSION_API_BASE: 'http://localhost:8080',
  USER_SERVICE_BASE: 'http://localhost:8100'
};

// 模拟获取Auth0 token的函数 (在实际应用中，这来自useAuth hook)
async function getAuth0Token() {
  // 在实际应用中，这将来自 useAuth().getAccessToken()
  // 这里我们返回一个模拟的token结构，你需要替换为实际的Auth0 token
  console.log('⚠️  请确保你已经通过Auth0登录，并将真实token替换到这里');
  
  // 返回模拟token - 在实际测试中需要替换
  return 'YOUR_REAL_AUTH0_TOKEN_HERE';
}

// 获取用户ID (在实际应用中来自Auth0用户信息)
function getUserId() {
  // 在实际应用中，这将来自 useAuth0().user.sub
  // Auth0 用户ID通常是 "auth0|..." 格式
  console.log('⚠️  请确保你已经设置了正确的用户ID');
  return 'auth0|YOUR_USER_ID_HERE'; // 替换为你的真实用户ID
}

// HTTP请求辅助函数
async function makeRequest(url, options = {}) {
  try {
    console.log(`🌐 ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`✅ ${response.status} ${response.statusText}`);
    console.log('📦 Response:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`❌ Request failed:`, error);
    return { success: false, error: error.message };
  }
}

// 测试步骤
async function testSessionAPI() {
  console.log('🧪 开始Session API集成测试');
  console.log('=' .repeat(50));
  
  // 步骤1: 获取认证token
  console.log('\n📋 步骤1: 获取Auth0认证token');
  const token = await getAuth0Token();
  const userId = getUserId();
  
  if (token === 'YOUR_REAL_AUTH0_TOKEN_HERE' || userId === 'auth0|YOUR_USER_ID_HERE') {
    console.log('❌ 请先设置真实的Auth0 token和用户ID');
    console.log('💡 提示: 在浏览器中登录后，在控制台运行以下代码获取token:');
    console.log('   const auth = useAuth();');
    console.log('   const token = await auth.getAccessToken();');
    console.log('   console.log("Token:", token);');
    console.log('   console.log("User ID:", auth.auth0User.sub);');
    return;
  }
  
  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };
  
  console.log(`🔑 使用用户ID: ${userId}`);
  console.log(`🎫 Token前缀: ${token.substring(0, 20)}...`);
  
  // 步骤2: 测试健康检查
  console.log('\n📋 步骤2: 测试Session API健康检查');
  const healthResult = await makeRequest(
    `${config.SESSION_API_BASE}/api/sessions/health`,
    {
      method: 'GET',
      headers: authHeaders
    }
  );
  
  if (!healthResult.success) {
    console.log('❌ 健康检查失败，Session API可能没有运行');
    console.log('💡 请确保Session API在 http://localhost:8080 运行');
    return;
  }
  
  // 步骤3: 创建新会话
  console.log('\n📋 步骤3: 创建新会话');
  const sessionTitle = `Test Session ${new Date().toISOString()}`;
  const metadata = JSON.stringify({
    source: 'integration_test',
    timestamp: new Date().toISOString(),
    test_version: '1.0'
  });
  
  const createSessionUrl = `${config.SESSION_API_BASE}/api/sessions?` +
    `user_id=${encodeURIComponent(userId)}&` +
    `title=${encodeURIComponent(sessionTitle)}&` +
    `metadata=${encodeURIComponent(metadata)}`;
  
  const createResult = await makeRequest(createSessionUrl, {
    method: 'POST',
    headers: authHeaders
  });
  
  if (!createResult.success) {
    console.log('❌ 会话创建失败');
    return;
  }
  
  const sessionId = createResult.data.session?.id;
  if (!sessionId) {
    console.log('❌ 会话创建成功但未返回session ID');
    return;
  }
  
  console.log(`✅ 会话创建成功，ID: ${sessionId}`);
  
  // 步骤4: 获取用户所有会话
  console.log('\n📋 步骤4: 获取用户所有会话');
  const getUserSessionsUrl = `${config.SESSION_API_BASE}/api/sessions/user/${encodeURIComponent(userId)}?limit=10`;
  
  const getUserSessionsResult = await makeRequest(getUserSessionsUrl, {
    method: 'GET',
    headers: authHeaders
  });
  
  // 步骤5: 获取会话消息
  console.log('\n📋 步骤5: 获取会话消息');
  const getMessagesUrl = `${config.SESSION_API_BASE}/api/sessions/${sessionId}/messages?` +
    `user_id=${encodeURIComponent(userId)}&limit=20`;
  
  const getMessagesResult = await makeRequest(getMessagesUrl, {
    method: 'GET',
    headers: authHeaders
  });
  
  // 步骤6: 更新会话标题
  console.log('\n📋 步骤6: 更新会话标题');
  const newTitle = `Updated Test Session ${new Date().toISOString()}`;
  const updateSessionUrl = `${config.SESSION_API_BASE}/api/sessions/${sessionId}?` +
    `title=${encodeURIComponent(newTitle)}`;
  
  const updateResult = await makeRequest(updateSessionUrl, {
    method: 'PUT',
    headers: authHeaders
  });
  
  // 步骤7: 搜索会话
  console.log('\n📋 步骤7: 搜索会话');
  const searchUrl = `${config.SESSION_API_BASE}/api/sessions/search?` +
    `user_id=${encodeURIComponent(userId)}&` +
    `query=${encodeURIComponent('Test')}&limit=5`;
  
  const searchResult = await makeRequest(searchUrl, {
    method: 'GET',
    headers: authHeaders
  });
  
  // 步骤8: 获取会话详情
  console.log('\n📋 步骤8: 获取会话详情');
  const getSessionUrl = `${config.SESSION_API_BASE}/api/sessions/${sessionId}?include_history=true&include_stats=true`;
  
  const getSessionResult = await makeRequest(getSessionUrl, {
    method: 'GET',
    headers: authHeaders
  });
  
  // 测试总结
  console.log('\n' + '=' .repeat(50));
  console.log('📊 测试总结');
  
  const results = [
    { name: '健康检查', success: healthResult.success },
    { name: '创建会话', success: createResult.success },
    { name: '获取用户会话', success: getUserSessionsResult.success },
    { name: '获取会话消息', success: getMessagesResult.success },
    { name: '更新会话', success: updateResult.success },
    { name: '搜索会话', success: searchResult.success },
    { name: '获取会话详情', success: getSessionResult.success }
  ];
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有测试通过！Session API集成正常工作');
  } else {
    console.log('\n⚠️  部分测试失败，请检查Session API配置');
  }
  
  // 清理：删除测试会话
  console.log('\n📋 清理: 删除测试会话');
  const deleteResult = await makeRequest(
    `${config.SESSION_API_BASE}/api/sessions/${sessionId}`,
    {
      method: 'DELETE',
      headers: authHeaders
    }
  );
  
  if (deleteResult.success) {
    console.log('✅ 测试会话已清理');
  } else {
    console.log(`⚠️  测试会话清理失败，请手动删除: ${sessionId}`);
  }
}

// 导出测试函数，这样可以在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.testSessionAPI = testSessionAPI;
  console.log('💡 在浏览器控制台中运行: testSessionAPI()');
} else {
  // Node.js环境
  testSessionAPI().catch(console.error);
}