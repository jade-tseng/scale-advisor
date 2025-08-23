import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ClaudeClient } from '../client.js';

/**
 * Arguments for GitHub repository analysis tool
 */
export interface GitHubAnalyzerArgs {
    repository_url: string;
    analysis_depth?: 'basic' | 'detailed';
    include_dependencies?: boolean;
}

/**
 * Tool definition for GitHub repository analysis
 */
export const githubAnalyzerToolDefinition: Tool = {
    name: "github_analyze_repository",
    description: "Analyze a GitHub repository to understand what it does, technologies used, architecture, and key features. Uses Claude's web search capabilities to gather comprehensive information.",
    inputSchema: {
        type: "object",
        properties: {
            repository_url: {
                type: "string",
                description: "The GitHub repository URL to analyze (e.g., https://github.com/owner/repo)",
                default: "https://github.com/microsoft/vscode"
            },
            analysis_depth: {
                type: "string",
                enum: ["basic", "detailed"],
                description: "Level of analysis detail (default: basic)",
                default: "basic"
            },
            include_dependencies: {
                type: "boolean",
                description: "Whether to analyze dependencies and tech stack in detail (default: true)",
                default: true
            }
        },
        required: [],
    },
};

/**
 * Type guard for GitHub analyzer arguments
 */
function isGitHubAnalyzerArgs(args: unknown): args is GitHubAnalyzerArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "repository_url" in args &&
        typeof (args as { repository_url: unknown }).repository_url === "string" &&
        (args as { repository_url: string }).repository_url.includes("github.com")
    );
}

/**
 * Extracts repository information from GitHub URL
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; fullName: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, ''); // Remove .git suffix if present
    
    return {
        owner,
        repo: cleanRepo,
        fullName: `${owner}/${cleanRepo}`
    };
}

/**
 * Generates analysis prompt for Claude
 */
function generateAnalysisPrompt(repoInfo: { owner: string; repo: string; fullName: string }, args: GitHubAnalyzerArgs): string {
    const { fullName } = repoInfo;
    const depth = args.analysis_depth || 'basic';
    const includeDeps = args.include_dependencies !== false;

    let prompt = `Please analyze the GitHub repository "${fullName}" and provide a comprehensive overview. `;
    
    if (depth === 'detailed') {
        prompt += `I need a detailed analysis including:

1. **Repository Overview**
   - What does this project do? (main purpose and functionality)
   - Target audience and use cases
   - Project maturity and activity level

2. **Technical Architecture**
   - Programming languages used (with percentages if available)
   - Frameworks and libraries
   - Architecture patterns and design decisions
   - Key directories and file structure

3. **Technology Stack**`;
        
        if (includeDeps) {
            prompt += `
   - Dependencies and package managers used
   - Build tools and development workflow
   - Testing frameworks
   - CI/CD setup`;
        }
        
        prompt += `

4. **Key Features & Functionality**
   - Main features and capabilities
   - Notable code patterns or implementations
   - Performance considerations

5. **Development & Community**
   - Documentation quality
   - Contribution guidelines
   - Community activity and maintenance status
   - Recent updates and roadmap

Please search for and review the repository's README, package.json/requirements.txt, source code structure, and any documentation to provide accurate insights.`;
    } else {
        prompt += `I need a basic analysis covering:

1. **What it does**: Main purpose and functionality
2. **Technologies used**: Programming languages, main frameworks/libraries
3. **Project type**: (web app, library, CLI tool, etc.)
4. **Key features**: Main capabilities and use cases`;
        
        if (includeDeps) {
            prompt += `
5. **Tech stack**: Dependencies and build tools used`;
        }
        
        prompt += `

Please search for the repository and provide a concise but informative overview.`;
    }
    
    return prompt;
}

/**
 * Handles GitHub repository analysis tool calls
 */
export async function handleGitHubAnalyzerTool(
    claudeClient: ClaudeClient,
    args: GitHubAnalyzerArgs | undefined
): Promise<CallToolResult> {
    try {
        // Provide defaults if no args provided
        const safeArgs: GitHubAnalyzerArgs = {
            repository_url: args?.repository_url || "https://github.com/microsoft/vscode",
            analysis_depth: args?.analysis_depth || "basic",
            include_dependencies: args?.include_dependencies ?? true
        };

        if (!isGitHubAnalyzerArgs(safeArgs)) {
            throw new Error("Invalid arguments for github_analyze_repository. Repository URL is required and must be a valid GitHub URL.");
        }

        // Parse GitHub URL
        const repoInfo = parseGitHubUrl(safeArgs.repository_url);
        if (!repoInfo) {
            throw new Error("Invalid GitHub URL format. Please provide a valid GitHub repository URL (e.g., https://github.com/owner/repo)");
        }

        // Generate analysis prompt
        const analysisPrompt = generateAnalysisPrompt(repoInfo, safeArgs);

        // Use Claude to analyze the repository
        const result = await claudeClient.chatCompletion({
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 2048,
            temperature: 0.3, // Lower temperature for more factual analysis
            system: "You are a senior software engineer and technical analyst. When analyzing GitHub repositories, search for and review the actual repository content including README files, source code, configuration files, and documentation. Provide accurate, detailed technical insights based on what you find. If you cannot access the repository directly, clearly state this limitation."
        });
        
        return {
            content: [{ 
                type: "text", 
                text: `# GitHub Repository Analysis: ${repoInfo.fullName}\n\n${result}` 
            }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error analyzing GitHub repository: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
