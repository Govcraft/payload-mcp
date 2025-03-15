// Test script for Payload MCP endpoint
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/v1/payload-mcp';

async function testPayloadMCP() {
  try {
    console.log('Sending request to Payload MCP endpoint to test listTools...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        tools: [
          {
            name: 'listTools',
            parameters: {
              includeParameters: true
            },
          },
        ],
      }),
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testPayloadMCP(); 