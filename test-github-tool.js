// Simple test script for the GitHub analyzer tool
// Run with: node test-github-tool.js

async function testGitHubAnalyzer() {
    const serverUrl = 'http://localhost:8080/mcp';
    
    // First, create a session
    const sessionResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            }
        })
    });
    
    const sessionData = await sessionResponse.json();
    const sessionId = sessionResponse.headers.get('mcp-session-id');
    
    console.log('Session created:', sessionId);
    
    // List available tools
    const toolsResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'mcp-session-id': sessionId
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list'
        })
    });
    
    const tools = await toolsResponse.json();
    console.log('Available tools:', tools.result.tools.map(t => t.name));
    
    // Test the GitHub analyzer tool
    const analyzeResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'mcp-session-id': sessionId
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'github_analyze_repository',
                arguments: {
                    repository_url: 'https://github.com/microsoft/vscode',
                    analysis_depth: 'basic',
                    include_dependencies: true
                }
            }
        })
    });
    
    const result = await analyzeResponse.json();
    console.log('Analysis result:', result.result.content[0].text);
}

// Run the test
testGitHubAnalyzer().catch(console.error);
