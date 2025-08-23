import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ClaudeClient } from '../client.js';
import { ClaudeChatArgs, ClaudeCompletionArgs } from '../types.js';

/**
 * Tool definition for Claude chat completion
 */
export const claudeChatToolDefinition: Tool = {
    name: "claude_chat",
    description: "Send messages to Claude for conversational AI responses. Supports multi-turn conversations with system prompts.",
    inputSchema: {
        type: "object",
        properties: {
            messages: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" }
                    },
                    required: ["role", "content"]
                },
                description: "Array of messages in the conversation"
            },
            model: {
                type: "string",
                description: "Claude model to use (default: claude-3-5-sonnet-20241022)",
                default: "claude-3-5-sonnet-20241022"
            },
            max_tokens: {
                type: "number",
                description: "Maximum tokens in response (default: 1024)",
                default: 1024
            },
            temperature: {
                type: "number",
                description: "Response creativity (0-1, default: 0.7)",
                default: 0.7
            },
            system: {
                type: "string",
                description: "System prompt to guide Claude's behavior"
            }
        },
        required: ["messages"],
    },
};

/**
 * Tool definition for Claude text completion
 */
export const claudeCompletionToolDefinition: Tool = {
    name: "claude_completion",
    description: "Get text completion from Claude for a given prompt. Simpler interface for single-turn interactions.",
    inputSchema: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "The text prompt to complete"
            },
            model: {
                type: "string",
                description: "Claude model to use (default: claude-3-5-sonnet-20241022)",
                default: "claude-3-5-sonnet-20241022"
            },
            max_tokens: {
                type: "number",
                description: "Maximum tokens in response (default: 1024)",
                default: 1024
            },
            temperature: {
                type: "number",
                description: "Response creativity (0-1, default: 0.7)",
                default: 0.7
            }
        },
        required: ["prompt"],
    },
};

/**
 * Type guard for Claude chat arguments
 */
function isClaudeChatArgs(args: unknown): args is ClaudeChatArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "messages" in args &&
        Array.isArray((args as { messages: unknown }).messages) &&
        (args as { messages: unknown[] }).messages.every(msg => 
            typeof msg === "object" &&
            msg !== null &&
            "role" in msg &&
            "content" in msg &&
            typeof (msg as { role: unknown }).role === "string" &&
            typeof (msg as { content: unknown }).content === "string"
        )
    );
}

/**
 * Type guard for Claude completion arguments
 */
function isClaudeCompletionArgs(args: unknown): args is ClaudeCompletionArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "prompt" in args &&
        typeof (args as { prompt: unknown }).prompt === "string"
    );
}

/**
 * Handles Claude chat tool calls
 */
export async function handleClaudeChatTool(
    client: ClaudeClient, 
    args: unknown
): Promise<CallToolResult> {
    try {
        if (!args) {
            throw new Error("No arguments provided");
        }

        if (!isClaudeChatArgs(args)) {
            throw new Error("Invalid arguments for claude_chat");
        }

        const result = await client.chatCompletion(args);
        
        return {
            content: [{ type: "text", text: result }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

/**
 * Handles Claude completion tool calls
 */
export async function handleClaudeCompletionTool(
    client: ClaudeClient, 
    args: unknown
): Promise<CallToolResult> {
    try {
        if (!args) {
            throw new Error("No arguments provided");
        }

        if (!isClaudeCompletionArgs(args)) {
            throw new Error("Invalid arguments for claude_completion");
        }

        const result = await client.textCompletion(args);
        
        return {
            content: [{ type: "text", text: result }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
