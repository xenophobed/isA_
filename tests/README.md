# Streaming Tests

This directory contains test files for debugging and validating the streaming implementation.

## Files

### 📊 **streaming_events.log**
- **Purpose**: Complete log of streaming events from the API
- **Contains**: 117 events showing the actual structure of streaming responses
- **Key Finding**: Tokens are in `custom_event.metadata.raw_chunk.response_token.token`
- **Usage**: Reference for understanding the API's streaming format

### 🧪 **test_streaming.js**
- **Purpose**: Comprehensive test that captures all streaming events
- **Features**: 
  - Logs all events with timestamps
  - Analyzes event types and patterns
  - Saves detailed log to file
  - Provides event summary
- **Usage**: `node test_streaming.js`
- **Output**: Creates `streaming_events.log` with detailed analysis

### 🎯 **simple_test.js**
- **Purpose**: Focused test for debugging token extraction
- **Features**:
  - Shows individual tokens as they arrive
  - Demonstrates formatted_content extraction
  - Has 30-second timeout
  - Clean, readable output
- **Usage**: `node simple_test.js`
- **Best for**: Quick validation of streaming behavior

## Key Insights

From `streaming_events.log` analysis:

1. **Token Structure**: Tokens are nested in `custom_event` → `metadata.raw_chunk.response_token.token`
2. **Event Flow**: start → ~107 custom_events (with tokens) → content → end
3. **JSON Wrapping**: Final content is JSON with `formatted_content` field
4. **Token Count**: ~85 actual response tokens streaming the JSON structure

## Usage

1. **Debug streaming issues**: Use `simple_test.js`
2. **Analyze API changes**: Use `test_streaming.js` to generate new logs
3. **Reference behavior**: Check `streaming_events.log` for expected patterns