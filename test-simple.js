// Simple test for GitHub analyzer tool using direct HTTP calls
async function testGitHubAnalyzer() {
    try {
        // Test health endpoint first
        console.log('Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:8080/health');
        const health = await healthResponse.json();
        console.log('Health:', health);

        // Test SSE endpoint which might be simpler
        console.log('\nTesting GitHub analyzer via SSE endpoint...');
        
        // For now, let's test the Claude chat tool to verify the server works
        const testResponse = await fetch('http://localhost:8080/sse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {
                    name: 'claude_chat',
                    arguments: {
                        messages: [
                            {
                                role: 'user',
                                content: 'Hello, can you analyze the GitHub repository https://github.com/facebook/react? Tell me what it does and what technologies it uses.'
                            }
                        ]
                    }
                }
            })
        });

        if (testResponse.ok) {
            const result = await testResponse.text();
            console.log('Claude response:', result);
        } else {
            console.log('Error:', testResponse.status, await testResponse.text());
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testGitHubAnalyzer();
