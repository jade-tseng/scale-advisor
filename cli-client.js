#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

class MCPCLIClient {
    constructor() {
        this.mcpProcess = null;
        this.requestId = 1;
    }

    async start() {
        console.log('🚀 Starting MCP Server...');
        
        // Start MCP server in STDIO mode
        this.mcpProcess = spawn('node', ['dist/index.js', '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.mcpProcess.stderr.on('data', (data) => {
            // Show MCP server console output for agent progress
            const output = data.toString().trim();
            if (output) {
                console.log(`🤖 ${output}`);
            }
        });

        // Initialize MCP session
        await this.sendRequest({
            jsonrpc: '2.0',
            id: this.requestId++,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'scale-advisor-cli',
                    version: '1.0.0'
                }
            }
        });

        // Send initialized notification
        await this.sendNotification({
            jsonrpc: '2.0',
            method: 'notifications/initialized'
        });

        console.log('✅ MCP Server ready for commands\n');
        this.showMenu();
    }

    async sendRequest(request) {
        return new Promise((resolve, reject) => {
            const requestStr = JSON.stringify(request) + '\n';
            let buffer = '';
            
            const onData = (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                
                // Keep the last incomplete line in buffer
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    
                    // Skip console.log output, only parse JSON responses
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                        try {
                            const response = JSON.parse(trimmed);
                            if (response.jsonrpc && response.id === request.id) {
                                this.mcpProcess.stdout.removeListener('data', onData);
                                resolve(response);
                                return;
                            }
                        } catch (error) {
                            // Continue parsing other lines
                        }
                    }
                }
            };

            this.mcpProcess.stdout.on('data', onData);
            this.mcpProcess.stdin.write(requestStr);
            
            // Timeout after 120 seconds for comprehensive analysis
            setTimeout(() => {
                this.mcpProcess.stdout.removeListener('data', onData);
                reject(new Error('Request timeout'));
            }, 120000);
        });
    }

    async sendNotification(notification) {
        const notificationStr = JSON.stringify(notification) + '\n';
        this.mcpProcess.stdin.write(notificationStr);
    }

    showMenu() {
        console.log('📋 Available Commands:');
        console.log('1. comprehensive - Run comprehensive analysis');
        console.log('2. infra - Run infrastructure generation agent');
        console.log('3. pr - Create GitHub PR');
        console.log('4. exit - Exit CLI');
        console.log('');
        this.promptUser();
    }

    promptUser() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter command (1-4): ', async (answer) => {
            rl.close();
            
            switch (answer.trim()) {
                case '1':
                case 'comprehensive':
                    await this.runComprehensiveAnalysis();
                    break;
                case '2':
                case 'infra':
                    await this.generateInfrastructure();
                    break;
                case '3':
                case 'pr':
                    await this.createGitHubPR();
                    break;
                case '4':
                case 'exit':
                    this.exit();
                    return;
                default:
                    console.log('❌ Invalid command');
                    this.showMenu();
                    return;
            }
            
            console.log('\n' + '='.repeat(80) + '\n');
            this.showMenu();
        });
    }

    async runComprehensiveAnalysis() {
        console.log('🔍 Running comprehensive analysis...');
        console.log('⏳ Starting GitHub + Cloud analysis (faster workflow)...\n');
        
        try {
            const startTime = Date.now();
            console.log('🤖 Initializing analysis agents...');
            
            const response = await this.sendRequest({
                jsonrpc: '2.0',
                id: this.requestId++,
                method: 'tools/call',
                params: {
                    name: 'analyze_repository_and_cloud',
                    arguments: {
                        repository_url: 'https://github.com/microsoft/vscode',
                        analysis_depth: 'basic',
                        focus_areas: ['scalability', 'performance']
                    }
                }
            }, 180000); // 3 minute timeout

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            if (response.error) {
                console.log('❌ Error:', response.error.message);
            } else {
                console.log(`\n✅ Analysis Complete in ${duration}s:\n`);
                console.log(response.result.content[0].text);
            }
        } catch (error) {
            console.log('❌ Failed:', error.message);
        }
    }

    async generateInfrastructure() {
        console.log('🏗️ Running Infrastructure Generation Agent...');
        console.log('⏳ Agent analyzing cloud resource requirements and generating Terraform...\n');
        
        try {
            const startTime = Date.now();
            const response = await this.sendRequest({
                jsonrpc: '2.0',
                id: this.requestId++,
                method: 'tools/call',
                params: {
                    name: 'generate_terraform_infrastructure',
                    arguments: {
                        input_file: 'mockdata.json',
                        output_directory: 'infra-gen'
                    }
                }
            });

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            if (response.error) {
                console.log('❌ Error:', response.error.message);
            } else {
                console.log(`\n✅ Infrastructure Agent Complete in ${duration}s:\n`);
                console.log(response.result.content[0].text);
            }
        } catch (error) {
            console.log('❌ Failed:', error.message);
        }
    }

    async createGitHubPR() {
        console.log('📤 Creating GitHub PR...\n');
        
        try {
            const response = await this.sendRequest({
                jsonrpc: '2.0',
                id: this.requestId++,
                method: 'tools/call',
                params: {
                    name: 'create_github_pr',
                    arguments: {
                        repository_url: 'https://github.com/jade-tseng/scale-advisor',
                        branch_name: 'feature/ai-generated-infrastructure',
                        pr_title: 'Add AI-Generated Terraform Infrastructure'
                    }
                }
            });

            if (response.error) {
                console.log('❌ Error:', response.error.message);
            } else {
                console.log('✅ GitHub PR Created:\n');
                console.log(response.result.content[0].text);
            }
        } catch (error) {
            console.log('❌ Failed:', error.message);
        }
    }

    exit() {
        console.log('👋 Shutting down...');
        if (this.mcpProcess) {
            this.mcpProcess.kill();
        }
        process.exit(0);
    }
}

// Start the CLI
const client = new MCPCLIClient();
client.start().catch(console.error);
