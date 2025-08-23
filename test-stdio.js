// Test the GitHub analyzer tool using STDIO transport
import { spawn } from 'child_process';

function testGitHubAnalyzer() {
    return new Promise((resolve, reject) => {
        // Start the MCP server in STDIO mode
        const server = spawn('node', ['dist/index.js', '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let responseData = '';
        
        server.stdout.on('data', (data) => {
            responseData += data.toString();
            console.log('Server response:', data.toString());
        });

        server.stderr.on('data', (data) => {
            console.log('Server stderr:', data.toString());
        });

        server.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
            resolve(responseData);
        });

        // Send initialization message
        const initMessage = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: {
                    name: "test-client",
                    version: "1.0.0"
                }
            }
        }) + '\n';

        console.log('Sending init message:', initMessage);
        server.stdin.write(initMessage);

        // Wait a bit, then send tools/list request
        setTimeout(() => {
            const listToolsMessage = JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/list"
            }) + '\n';

            console.log('Sending list tools message:', listToolsMessage);
            server.stdin.write(listToolsMessage);

            // Wait a bit more, then test the GitHub analyzer
            setTimeout(() => {
                const analyzeMessage = JSON.stringify({
                    jsonrpc: "2.0",
                    id: 3,
                    method: "tools/call",
                    params: {
                        name: "github_analyze_repository",
                        arguments: {
                            repository_url: "https://github.com/facebook/react",
                            analysis_depth: "basic"
                        }
                    }
                }) + '\n';

                console.log('Sending GitHub analyze message:', analyzeMessage);
                server.stdin.write(analyzeMessage);

                // Close after a delay
                setTimeout(() => {
                    server.stdin.end();
                }, 5000);
            }, 1000);
        }, 1000);
    });
}

testGitHubAnalyzer().catch(console.error);
