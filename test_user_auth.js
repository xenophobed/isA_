#!/usr/bin/env node

/**
 * Test script for User Authentication API
 * Based on /reference/how_to_user_auth.md
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:8100';
const TEST_USER_ID = 'google-oauth2|107896640181181053492';  // My Auth0 ID from the example
const TEST_AUTH_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImJCOVpmXzJucnhfN29samhPSnR3byJ9.eyJpc3MiOiJodHRwczovL2Rldi00N3pjcWFybHhpemRrYWRzLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDEwNzg5NjY0MDE4MTE4MTA1MzQ5MiIsImF1ZCI6WyJodHRwczovL2Rldi00N3pjcWFybHhpemRrYWRzLnVzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaHR0cHM6Ly9kZXYtNDd6Y3Fhcmx4aXpka2Fkcy51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzU0ODAyMzc4LCJleHAiOjE3NTQ4ODg3NzgsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhenAiOiJWc20wczIzSlRLekRycTlicTBmb0t5WWllT0N5ZW9RSiJ9.u2udfhW9m-I6EQOxcPcbtDkiV1vITW3t5megxTAj2Rk-wvLERZpoDAvQo_Ju4ObJTZWshzvkp-qmF0R82yt7DHGduUZ6sGuWYrKbE4xNhgnhu0tNFA0tmOUHdv1eFx-iKquqgDurt0xsu9lDwBryOb2n3ylaFUKgV2WDvSpFSjACFTZlQxnSK1t0crgb0qS4KUPez37ZbaaHiauL5EX-jc_VlpROnuVHwmK2G6quPJOri8vTHNKHnXQu7w4EoQWzZJdSMXHa9z0lKmEbRMhlEswh9s5ADXjNl6aCkqNNkH2_j9aPdMEjPYaA2Q5xABOeBKOjay7qfp8yIG7BwT03Dw';

async function testUserEnsure() {
  console.log('🧪 Testing User Ensure API...');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`👤 Test User ID: ${TEST_USER_ID}`);
  console.log('🔑 Auth Token: [REDACTED]');
  console.log('');

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/ensure`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        email: 'test@example.com',  // placeholder email
        name: 'Test User'
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`📄 Response Body:`, responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ API Test Successful!');
        console.log('📈 User Data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.log('⚠️  Response is not valid JSON, but request succeeded');
      }
    } else {
      console.log('❌ API Test Failed!');
      console.log('💥 Error Details:', responseText);
    }

  } catch (error) {
    console.log('🚨 Network Error:', error.message);
    
    // Check if service is running
    try {
      const healthCheck = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      console.log(`🏥 Health Check: ${healthCheck.status} ${healthCheck.statusText}`);
    } catch (healthError) {
      console.log('🏥 Health Check Failed - Service may not be running');
      console.log('💡 Please ensure the API service is running on localhost:8100');
    }
  }
}

async function testResourceAccess() {
  console.log('\n🔐 Testing Resource Access Check...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/resources/check-access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        resource_type: 'mcp_tool',
        resource_name: 'weather_get_weather',
        required_access_level: 'read_only'
      })
    });

    console.log(`📊 Resource Access Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resource Access Check Result:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Resource Access Check Failed');
      console.log(await response.text());
    }
    
  } catch (error) {
    console.log('🚨 Resource Access Check Error:', error.message);
  }
}

async function testUserResourceSummary() {
  console.log('\n📋 Testing User Resource Summary...');
  
  try {
    const encodedUserId = encodeURIComponent(TEST_USER_ID);
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${encodedUserId}/resources/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_AUTH_TOKEN}`
      }
    });

    console.log(`📊 Resource Summary Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ User Resource Summary:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Resource Summary Failed');
      console.log(await response.text());
    }
    
  } catch (error) {
    console.log('🚨 Resource Summary Error:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting User Authentication API Tests');
  console.log('='.repeat(50));
  
  await testUserEnsure();
  await testResourceAccess();
  await testUserResourceSummary();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests Complete');
}

runAllTests().catch(console.error);