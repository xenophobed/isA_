import React, { useState, useEffect } from 'react';
import { SimpleAIClient } from '../../services/SimpleAIClient';
import { useAuth } from '../../hooks/useAuth';

/**
 * Test component for debugging Dream (Image Generation) streaming issues
 */
export const TestDreamStream: React.FC = () => {
  const [client] = useState(() => new SimpleAIClient('http://localhost:8080'));
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState('text_to_image');
  const { user } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log('DREAM TEST LOG:', logEntry);
    setLogs(prev => [...prev, logEntry]);
  };

  // Setup event listeners
  useEffect(() => {
    if (!client) return;

    addLog('Setting up Dream event listeners...');

    const events = [
      'streaming:start',
      'streaming:status', 
      'streaming:finish',
      'streaming:end',
      'token:received',
      'message:received',
      'typing:changed',
      'custom_event',
      'tool:result',
      'tool:images_found',
      'error'
    ];

    const unsubscribers: Array<() => void> = [];

    events.forEach(eventName => {
      const unsubscribe = client.on(eventName, (data) => {
        addLog(`EVENT [${eventName}]: ${JSON.stringify(data, null, 2)}`);
        
        if (eventName === 'message:received') {
          setResult(data);
          setIsProcessing(false);
          addLog('Set isProcessing = false (from message:received)');
        }

        if (eventName === 'tool:images_found') {
          addLog(`=¼ IMAGES FOUND: ${data.urls?.length || 0} images`);
        }
      });
      
      if (unsubscribe) {
        unsubscribers.push(unsubscribe);
      }
    });

    return () => {
      addLog('Cleaning up Dream event listeners...');
      unsubscribers.forEach(cleanup => cleanup?.());
    };
  }, [client]);

  const handleTest = async () => {
    if (!client || isProcessing) return;

    // Clear previous logs and results
    setLogs([]);
    setResult(null);
    setError(null);
    setIsProcessing(true);
    
    addLog('Starting Dream (Image Generation) test request...');
    addLog(`User ID: ${user?.user_id || 'anonymous'}`);
    addLog(`Selected Mode: ${selectedMode}`);

    try {
      let requestMetadata;
      let prompt;

      // Configure request based on image mode
      switch (selectedMode) {
        case 'text_to_image':
          prompt = 'Generate a beautiful landscape with mountains and a lake at sunset';
          requestMetadata = {
            sender: 'dream-app',
            template_parameters: {
              app_id: "dream",
              template_id: "text_to_image_prompt",
              prompt_args: {
                mode: "text_to_image",
                text_prompt: prompt,
                style: "photorealistic",
                aspect_ratio: "16:9",
                quality: "high"
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'dream_test_session',
            metadata: {
              sender: 'dream-app',
              app: 'dream',
              requestType: 'image_generation'
            }
          };
          break;

        case 'sticker_generation':
          prompt = 'Create a cute cartoon cat sticker with big eyes';
          requestMetadata = {
            sender: 'dream-app',
            template_parameters: {
              app_id: "dream",
              template_id: "sticker_generation_prompt",
              prompt_args: {
                mode: "sticker_generation",
                sticker_description: prompt,
                style: "cute_cartoon",
                background: "transparent"
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'dream_test_session',
            metadata: {
              sender: 'dream-app',
              app: 'dream',
              requestType: 'sticker_generation'
            }
          };
          break;

        default:
          prompt = 'Transform this into a digital art masterpiece';
          requestMetadata = {
            sender: 'dream-app',
            template_parameters: {
              app_id: "dream",
              template_id: `${selectedMode}_prompt`,
              prompt_args: {
                mode: selectedMode,
                transformation_prompt: prompt,
                style: "artistic",
                quality: "high"
              }
            },
            user_id: user?.user_id || 'anonymous',
            session_id: 'dream_test_session',
            metadata: {
              sender: 'dream-app',
              app: 'dream',
              requestType: 'image_transformation'
            }
          };
      }

      addLog('Sending request with metadata: ' + JSON.stringify(requestMetadata, null, 2));

      const messageId = await client.sendMessage(prompt, requestMetadata);
      addLog(`Request sent, message ID: ${messageId}`);
      
    } catch (err: any) {
      const errorMessage = err.message || String(err);
      addLog(`Request failed: ${errorMessage}`);
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const imageModes = [
    { id: 'text_to_image', name: 'Create from Text', icon: '(' },
    { id: 'image_to_image', name: 'Transform Image', icon: '=' },
    { id: 'style_transfer', name: 'Change Style', icon: '<¨' },
    { id: 'sticker_generation', name: 'Make Stickers', icon: '<÷' },
    { id: 'face_swap', name: 'Swap Faces', icon: '=e' },
    { id: 'professional_headshot', name: 'Pro Headshots', icon: '=T' },
    { id: 'photo_inpainting', name: 'Remove Objects', icon: '='' }
  ];

  return (
    <div className="p-6 bg-gray-900 text-white h-screen overflow-hidden">
      <h1 className="text-2xl font-bold mb-4"><¨ Test: Dream Stream (Image Generation)</h1>
      
      {/* Control Panel */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        {/* Image Mode Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Image Mode:</label>
          <select 
            value={selectedMode} 
            onChange={(e) => setSelectedMode(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
          >
            {imageModes.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.icon} {mode.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleTest}
            disabled={isProcessing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded"
          >
            {isProcessing ? 'Generating...' : 'Run Dream Test'}
          </button>
          
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Clear Logs
          </button>
        </div>

        {/* Status */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Processing:</span>
            <span className={isProcessing ? 'text-yellow-400' : 'text-green-400'}>
              {isProcessing ? ' Yes' : ' No'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Has Result:</span>
            <span className={result ? 'text-green-400' : 'text-gray-500'}>
              {result ? ' Yes' : ' No'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Has Error:</span>
            <span className={error ? 'text-red-400' : 'text-gray-500'}>
              {error ? ' Yes' : ' No'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-240px)]">
        {/* Logs Panel */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">Event Logs ({logs.length})</h3>
          <div className="bg-black rounded p-2 h-[calc(100%-40px)] overflow-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click "Run Dream Test" to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Result/Error Panel */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">Result/Error</h3>
          <div className="bg-black rounded p-2 h-[calc(100%-40px)] overflow-auto">
            {error && (
              <div className="mb-4">
                <h4 className="text-red-400 font-bold mb-2">Error:</h4>
                <pre className="text-red-300 text-xs whitespace-pre-wrap">{error}</pre>
              </div>
            )}
            
            {result && (
              <div>
                <h4 className="text-green-400 font-bold mb-2">Final Result:</h4>
                <div className="space-y-2 text-xs">
                  <div className="text-gray-400">
                    <div>Role: <span className="text-white">{result.role}</span></div>
                    <div>ID: <span className="text-white">{result.id}</span></div>
                    <div>Sender: <span className="text-white">{result.metadata?.sender || 'none'}</span></div>
                    <div>Content Length: <span className="text-white">{result.content?.length || 0}</span></div>
                    <div>Has Media: <span className="text-white">{result.metadata?.has_media ? 'Yes' : 'No'}</span></div>
                    {result.metadata?.media_items && (
                      <div>Media Count: <span className="text-white">{result.metadata.media_items.length}</span></div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-600 pt-2">
                    <div className="text-gray-400 mb-1">Content:</div>
                    <pre className="text-white whitespace-pre-wrap bg-gray-900 p-2 rounded max-h-32 overflow-auto">
                      {result.content}
                    </pre>
                  </div>
                  
                  {result.metadata && (
                    <div className="border-t border-gray-600 pt-2">
                      <div className="text-gray-400 mb-1">Metadata:</div>
                      <pre className="text-gray-300 whitespace-pre-wrap bg-gray-900 p-2 rounded max-h-32 overflow-auto">
                        {JSON.stringify(result.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!result && !error && (
              <div className="text-gray-500">No result yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};