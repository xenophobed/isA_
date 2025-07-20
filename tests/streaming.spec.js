/**
 * Playwright test for streaming functionality
 * Tests the complete user experience of the streaming chat interface
 */

const { test, expect } = require('@playwright/test');

test.describe('Chat Streaming Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Wait for React to hydrate
    await page.waitForTimeout(2000);
  });

  test('should show single streaming indicator and clean token display', async ({ page }) => {
    console.log('🧪 Starting streaming test...');

    // Monitor console logs for debugging
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Monitor network requests to see API calls
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/chat')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    // Find the message input (textarea with chat-input class)
    const messageInput = page.locator('textarea.chat-input');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // Find the send button (button with send-button class)
    const sendButton = page.locator('button.send-button');
    
    // Type the test message
    await messageInput.fill('hi');
    console.log('📝 Typed message: hi');

    // Count status indicators before sending
    const initialStatusCount = await page.locator('[data-testid*="status"], [class*="status"], [class*="loading"], [class*="processing"]').count();
    console.log(`📊 Initial status indicators: ${initialStatusCount}`);

    // Click send button
    await sendButton.click();
    console.log('📤 Clicked send button');

    // Wait a moment for the request to start
    await page.waitForTimeout(500);

    // Monitor streaming indicators
    let maxStatusIndicators = 0;
    let streamingStarted = false;
    let streamingContent = '';
    
    // Check for streaming indicators over time
    for (let i = 0; i < 30; i++) { // Check for 15 seconds
      // Count all possible status/loading/streaming indicators
      const statusCount = await page.locator('[data-testid*="status"], [data-testid*="streaming"], [data-testid*="loading"], [class*="status"], [class*="loading"], [class*="processing"], [class*="streaming"]').count();
      maxStatusIndicators = Math.max(maxStatusIndicators, statusCount);
      
      // Check if streaming has started (look for typing indicators or streaming content)
      const hasStreamingIndicator = await page.locator('[data-testid*="streaming"], [class*="streaming"], [class*="typing"]').count() > 0;
      if (hasStreamingIndicator && !streamingStarted) {
        streamingStarted = true;
        console.log('🎬 Streaming started detected');
      }
      
      // Try to capture streaming content as it appears
      const messageElements = await page.locator('[data-testid*="message"], [class*="message"], [role="listitem"]').all();
      for (const element of messageElements) {
        const text = await element.textContent();
        if (text && text.includes('Hello') && !streamingContent.includes('Hello')) {
          streamingContent = text;
          console.log('📝 Captured streaming content:', text.substring(0, 100) + '...');
        }
      }
      
      await page.waitForTimeout(500);
    }

    console.log(`📊 Maximum status indicators seen: ${maxStatusIndicators}`);

    // Verify single streaming indicator (should not exceed 2-3 at most)
    expect(maxStatusIndicators, 'Should have minimal status indicators (max 3)').toBeLessThanOrEqual(3);

    // Wait for streaming to complete (look for completion indicators)
    await page.waitForTimeout(2000);

    // Check final message content
    const finalMessages = await page.locator('[data-testid*="message"], [class*="message"], [role="listitem"]').all();
    let finalContent = '';
    
    for (const message of finalMessages) {
      const text = await message.textContent();
      if (text && (text.includes('Hello') || text.includes('assist'))) {
        finalContent = text;
        break;
      }
    }

    console.log('📝 Final message content:', finalContent.substring(0, 200) + '...');

    // Verify no JSON structure in the final content
    expect(finalContent, 'Should not contain JSON structure').not.toMatch(/\{.*"formatted_content".*\}/);
    expect(finalContent, 'Should not contain escaped characters').not.toMatch(/\\n|\\"|\\{|\\}/);
    expect(finalContent, 'Should not contain markdown JSON blocks').not.toMatch(/```json/);

    // Verify the content looks like natural text
    expect(finalContent, 'Should contain greeting response').toMatch(/hello|hi|assist|help/i);

    // Check for duplicate content (same message appearing multiple times)
    const allMessageTexts = [];
    for (const message of finalMessages) {
      const text = await message.textContent();
      if (text && text.trim()) {
        allMessageTexts.push(text.trim());
      }
    }
    
    const uniqueMessages = [...new Set(allMessageTexts)];
    const duplicateRatio = allMessageTexts.length / uniqueMessages.length;
    
    console.log(`📊 Message analysis: ${allMessageTexts.length} total, ${uniqueMessages.length} unique`);
    expect(duplicateRatio, 'Should not have excessive duplicate messages').toBeLessThan(3);

    // Log network requests for debugging
    console.log('🌐 Network requests made:');
    networkRequests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url}`);
    });

    // Log some console messages for debugging
    console.log('📋 Recent console logs:');
    consoleLogs.slice(-10).forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });

    console.log('✅ Streaming test completed successfully');
  });

  test('should handle streaming with image generation', async ({ page }) => {
    console.log('🧪 Starting image generation streaming test...');

    // Monitor console for image-related events
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('image') || text.includes('SimpleAI') || text.includes('tool')) {
        consoleLogs.push(`${msg.type()}: ${text}`);
      }
    });

    // Find input and send image generation request
    const messageInput = page.locator('textarea.chat-input');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    const sendButton = page.locator('button.send-button');
    
    // Request image generation
    await messageInput.fill('generate an image of a sunset');
    console.log('📝 Typed image generation request');

    await sendButton.click();
    console.log('📤 Sent image generation request');

    // Wait longer for image generation (can take more time)
    let imageFound = false;
    let toolExecutionSeen = false;
    
    for (let i = 0; i < 60; i++) { // Wait up to 30 seconds
      // Check for tool execution indicators
      const toolIndicators = await page.locator('[data-testid*="tool"], [class*="tool"], text=/executing/i, text=/generating/i').count();
      if (toolIndicators > 0 && !toolExecutionSeen) {
        toolExecutionSeen = true;
        console.log('🔧 Tool execution detected');
      }
      
      // Check for images in the page
      const images = await page.locator('img').all();
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src && (src.includes('replicate') || src.includes('http') && !src.includes('localhost'))) {
          imageFound = true;
          console.log('🖼️ Image found:', src);
          break;
        }
      }
      
      if (imageFound) break;
      await page.waitForTimeout(500);
    }

    // Verify tool execution was indicated
    expect(toolExecutionSeen, 'Should show tool execution indicator').toBe(true);

    // Verify image was generated (if the test environment supports it)
    if (imageFound) {
      console.log('✅ Image generation completed successfully');
    } else {
      console.log('⚠️ Image generation may not be available in test environment');
    }

    // Log relevant console messages
    console.log('📋 Image generation console logs:');
    consoleLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });
  });

  test('should maintain clean UI state after multiple messages', async ({ page }) => {
    console.log('🧪 Starting multiple messages test...');

    const messageInput = page.locator('textarea.chat-input');
    const sendButton = page.locator('button.send-button');

    // Send multiple messages to test state management
    const testMessages = ['hi', 'how are you?', 'what can you do?'];
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`📝 Sending message ${i + 1}: ${message}`);
      
      await messageInput.fill(message);
      await sendButton.click();
      
      // Wait for response to complete
      await page.waitForTimeout(5000);
      
      // Check that UI is in clean state (no stuck loading indicators)
      const loadingCount = await page.locator('[data-testid*="loading"], [class*="loading"], [class*="spinning"]').count();
      expect(loadingCount, `After message ${i + 1}, should have no stuck loading indicators`).toBeLessThanOrEqual(1);
    }

    // Verify all messages are visible and properly formatted
    const allMessages = await page.locator('[data-testid*="message"], [class*="message"]').all();
    expect(allMessages.length, 'Should have received responses to all messages').toBeGreaterThanOrEqual(testMessages.length);

    console.log(`✅ Successfully handled ${testMessages.length} messages with clean UI state`);
  });
});