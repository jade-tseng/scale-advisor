import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    InitializedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ClaudeClient } from './client.js';
import {
    claudeChatToolDefinition,
    claudeCompletionToolDefinition,
    handleClaudeChatTool,
    handleClaudeCompletionTool,
    githubAnalyzerToolDefinition,
    handleGitHubAnalyzerTool,
    cloudAnalyzerToolDefinition,
    handleCloudAnalyzerTool,
    comprehensiveAnalysisToolDefinition,
    handleComprehensiveAnalysisTool,
    securityAnalyzerToolDefinition,
    handleSecurityAnalyzerTool,
    infraGenToolDefinition,
    handleInfraGenTool,
    githubPRToolDefinition,
    handleGitHubPRTool,
} from './tools/index.js';

export function createStandaloneServer(apiKey: string): Server {
    const serverInstance = new Server(
        {
            name: "org/claude",
            version: "0.2.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    const claudeClient = new ClaudeClient(apiKey);

    serverInstance.setNotificationHandler(InitializedNotificationSchema, async () => {
        console.log('Claude MCP client initialized');
    });

    serverInstance.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [claudeChatToolDefinition, claudeCompletionToolDefinition, githubAnalyzerToolDefinition, cloudAnalyzerToolDefinition, securityAnalyzerToolDefinition, infraGenToolDefinition, githubPRToolDefinition, comprehensiveAnalysisToolDefinition],
    }));

    serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        switch (name) {
            case "claude_chat":
                return await handleClaudeChatTool(claudeClient, args);
            case "claude_completion":
                return await handleClaudeCompletionTool(claudeClient, args);
            case "github_analyze_repository":
                return await handleGitHubAnalyzerTool(claudeClient, args as any);
            case "analyze_cloud_resources":
                return await handleCloudAnalyzerTool(claudeClient, args);
            case "analyze_security_posture":
                return await handleSecurityAnalyzerTool(claudeClient, args as any);
            case "generate_terraform_infrastructure":
                return await handleInfraGenTool(claudeClient, args as any);
            case "create_github_pr":
                return await handleGitHubPRTool(claudeClient, args as any);
            case "analyze_repository_and_cloud":
                return await handleComprehensiveAnalysisTool(claudeClient, args);
            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    });

    return serverInstance;
}

export class ClaudeServer {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    getServer(): Server {
        return createStandaloneServer(this.apiKey);
    }
}
