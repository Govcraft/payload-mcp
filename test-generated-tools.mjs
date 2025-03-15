// Test script for auto-generated Payload CMS tools
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/v1/payload-mcp';

async function testGeneratedTools() {
  try {
    console.log('=== Testing Auto-Generated Payload CMS Tools ===\n');
    
    // Test createCollection tool
    console.log('Testing createCollection tool...');
    const collectionResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        tools: [
          {
            name: 'createCollection',
            parameters: {
              slug: 'posts',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true
                },
                {
                  name: 'content',
                  type: 'richText'
                },
                {
                  name: 'author',
                  type: 'relationship',
                  relationTo: 'users'
                }
              ],
              admin: {
                useAsTitle: 'title',
                description: 'Blog posts collection'
              }
            },
          },
        ],
      }),
    });
    
    const collectionData = await collectionResponse.json();
    console.log('Collection Tool Result:');
    console.log(collectionData.tool_results?.[0]?.output?.code || collectionData.tool_results?.[0]?.output?.error || 'No result');
    console.log('\n');
    
    // Test createField tool
    console.log('Testing createField tool...');
    const fieldResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        tools: [
          {
            name: 'createField',
            parameters: {
              name: 'featuredImage',
              type: 'upload',
              label: 'Featured Image',
              required: true,
              relationTo: 'media',
              admin: {
                description: 'The main image for this content',
                position: 'sidebar'
              }
            },
          },
        ],
      }),
    });
    
    const fieldData = await fieldResponse.json();
    console.log('Field Tool Result:');
    console.log(fieldData.tool_results?.[0]?.output?.code || fieldData.tool_results?.[0]?.output?.error || 'No result');
    console.log('\n');
    
    // Test createGlobal tool
    console.log('Testing createGlobal tool...');
    const globalResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        tools: [
          {
            name: 'createGlobal',
            parameters: {
              slug: 'siteSettings',
              label: 'Site Settings',
              fields: [
                {
                  name: 'siteName',
                  type: 'text',
                  required: true
                },
                {
                  name: 'siteDescription',
                  type: 'textarea'
                },
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media'
                }
              ],
              admin: {
                description: 'Global site settings'
              }
            },
          },
        ],
      }),
    });
    
    const globalData = await globalResponse.json();
    console.log('Global Tool Result:');
    console.log(globalData.tool_results?.[0]?.output?.code || globalData.tool_results?.[0]?.output?.error || 'No result');
    console.log('\n');
    
    // Test createAuth tool
    console.log('Testing createAuth tool...');
    const authResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        tools: [
          {
            name: 'createAuth',
            parameters: {
              collection: 'users',
              tokenExpiration: 7200,
              maxLoginAttempts: 5,
              lockTime: 600000,
              forgotPassword: {
                enabled: true,
                generateEmailHTML: true
              },
              cookies: {
                secure: true,
                sameSite: 'lax'
              }
            },
          },
        ],
      }),
    });
    
    const authData = await authResponse.json();
    console.log('Auth Tool Result:');
    console.log(authData.tool_results?.[0]?.output?.code || authData.tool_results?.[0]?.output?.error || 'No result');
    console.log('\n');
    
    // Test createConfig tool
    console.log('Testing createConfig tool...');
    const configResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        tools: [
          {
            name: 'createConfig',
            parameters: {
              serverURL: 'http://localhost:3000',
              collections: ['posts', 'media', 'users'],
              globals: ['siteSettings'],
              admin: {
                user: 'users',
                meta: {
                  titleSuffix: '- My Payload CMS',
                  favicon: '/assets/favicon.ico'
                }
              },
              typescript: {
                outputFile: 'payload-types.ts'
              }
            },
          },
        ],
      }),
    });
    
    const configData = await configResponse.json();
    console.log('Config Tool Result:');
    console.log(configData.tool_results?.[0]?.output?.code || configData.tool_results?.[0]?.output?.error || 'No result');
    console.log('\n');
    
    console.log('=== All auto-generated tools tested ===');
  } catch (error) {
    console.error('Error:', error);
  }
}

testGeneratedTools(); 