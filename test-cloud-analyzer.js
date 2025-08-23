// Test the cloud analyzer tool using STDIO transport
import { spawn } from 'child_process';

function testCloudAnalyzer() {
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

        console.log('Sending init message...');
        server.stdin.write(initMessage);

        // Wait a bit, then send tools/list request
        setTimeout(() => {
            const listToolsMessage = JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/list"
            }) + '\n';

            console.log('Listing tools...');
            server.stdin.write(listToolsMessage);

            // Wait a bit more, then test the cloud analyzer
            setTimeout(() => {
                const analyzeMessage = JSON.stringify({
                    jsonrpc: "2.0",
                    id: 3,
                    method: "tools/call",
                    params: {
                        name: "analyze_cloud_resources",
                        arguments: {
                            analysis_type: "overview",
                            include_recommendations: true
                        }
                    }
                }) + '\n';

                console.log('Testing cloud analyzer...');
                server.stdin.write(analyzeMessage);

                // Test detailed analysis
                setTimeout(() => {
                    const detailedAnalyzeMessage = JSON.stringify({
                        jsonrpc: "2.0",
                        id: 4,
                        method: "tools/call",
                        params: {
                            name: "analyze_cloud_resources",
                            arguments: {
                                analysis_type: "security",
                                include_recommendations: true
                            }
                        }
                    }) + '\n';

                    console.log('Testing security analysis...');
                    server.stdin.write(detailedAnalyzeMessage);

                    // Close after a delay
                    setTimeout(() => {
                        server.stdin.end();
                    }, 8000);
                }, 3000);
            }, 1000);
        }, 1000);
    });
}

testCloudAnalyzer().catch(console.error);
