/**
 * Arguments for Claude chat completion tool
 */
export interface ClaudeChatArgs {
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    model?: string;
    max_tokens?: number;
    temperature?: number;
    system?: string;
}

/**
 * Arguments for Claude text completion tool
 */
export interface ClaudeCompletionArgs {
    prompt: string;
    model?: string;
    max_tokens?: number;
    temperature?: number;
}

/**
 * Claude API response structure
 */
export interface ClaudeResponse {
    id: string;
    type: string;
    role: string;
    content: Array<{
        type: string;
        text: string;
    }>;
    model: string;
    stop_reason: string;
    stop_sequence: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}
