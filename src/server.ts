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
        tools: [claudeChatToolDefinition, claudeCompletionToolDefinition, githubAnalyzerToolDefinition],
    }));

    serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        switch (name) {
            case "claude_chat":
                return await handleClaudeChatTool(claudeClient, args);
            case "claude_completion":
                return await handleClaudeCompletionTool(claudeClient, args);
            case "github_analyze_repository":
                return await handleGitHubAnalyzerTool(claudeClient, args);
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
