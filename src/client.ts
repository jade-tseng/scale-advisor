import { ClaudeResponse, ClaudeChatArgs, ClaudeCompletionArgs } from './types.js';

export class ClaudeClient {
    private apiKey: string;
    private baseUrl: string = 'https://api.anthropic.com';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Performs a chat completion request with Claude
     */
    async chatCompletion(params: ClaudeChatArgs): Promise<string> {
        const requestBody = {
            model: params.model || 'claude-3-5-sonnet-20241022',
            max_tokens: params.max_tokens || 1024,
            temperature: params.temperature || 0.7,
            messages: params.messages,
            ...(params.system && { system: params.system })
        };

        const response = await fetch(`${this.baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let errorText: string;
            try {
                errorText = await response.text();
            } catch {
                errorText = "Unable to parse error response";
            }
            throw new Error(
                `Claude API error: ${response.status} ${response.statusText}\n${errorText}`
            );
        }

        const data: ClaudeResponse = await response.json();
        return this.formatResponse(data);
    }

    /**
     * Performs a text completion request (legacy format)
     */
    async textCompletion(params: ClaudeCompletionArgs): Promise<string> {
        // Convert to messages format for the API
        const chatParams: ClaudeChatArgs = {
            messages: [{ role: 'user', content: params.prompt }],
            model: params.model,
            max_tokens: params.max_tokens,
            temperature: params.temperature
        };

        return this.chatCompletion(chatParams);
    }

    private formatResponse(data: ClaudeResponse): string {
        if (data.content && data.content.length > 0) {
            return data.content
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('\n');
        }
        return JSON.stringify(data, null, 2);
    }
}
