import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ClaudeClient } from '../client.js';
import { handleGitHubAnalyzerTool } from './github-analyzer.js';
import { handleCloudAnalyzerTool } from './cloud-analyzer.js';
import { handleSecurityAnalyzerTool } from './security-analyzer.js';

/**
 * Arguments for comprehensive analysis tool
 */
export interface ComprehensiveAnalysisArgs {
    repository_url: string;
    analysis_depth?: 'basic' | 'detailed';
    focus_areas?: string[];
}

/**
 * Tool definition for comprehensive repository and cloud analysis
 */
export const comprehensiveAnalysisToolDefinition: Tool = {
    name: "analyze_repository_and_cloud",
    description: "Perform comprehensive analysis of a GitHub repository, cloud infrastructure, and security posture. Combines repository analysis, cloud resource analysis, and security assessment to provide scaling recommendations and architectural insights.",
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
            focus_areas: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Specific areas to focus on (e.g., ['security', 'performance', 'cost', 'scalability'])",
                default: []
            }
        },
        required: [],
    },
};

/**
 * Type guard for comprehensive analysis arguments
 */
function isComprehensiveAnalysisArgs(args: unknown): args is ComprehensiveAnalysisArgs {
    return (
        typeof args === "object" &&
        args !== null &&
        "repository_url" in args &&
        typeof (args as { repository_url: unknown }).repository_url === "string" &&
        (args as { repository_url: string }).repository_url.includes("github.com")
    );
}

/**
 * Handles comprehensive analysis tool calls using multi-agent workflow
 */
export async function handleComprehensiveAnalysisTool(
    client: ClaudeClient, 
    args: unknown
): Promise<CallToolResult> {
    try {
        if (!args) {
            throw new Error("No arguments provided");
        }

        if (!isComprehensiveAnalysisArgs(args)) {
            throw new Error("Invalid arguments for analyze_repository_and_cloud. Repository URL is required and must be a valid GitHub URL.");
        }

        console.log('Phase 1: Starting GitHub and Cloud analysis...');
        
        // Phase 1: Run GitHub and Cloud analysis (skip security for speed)
        const [githubResult, cloudResult] = await Promise.all([
            handleGitHubAnalyzerTool(client, { 
                repository_url: args.repository_url, 
                analysis_depth: args.analysis_depth || 'basic',
                include_dependencies: true
            }),
            handleCloudAnalyzerTool(client, { 
                analysis_type: 'overview',
                include_recommendations: true
            })
        ]);

        console.log('Phase 1: Analysis agents completed');

        // Check for errors in any analysis
        if (githubResult.isError || cloudResult.isError) {
            const errors = [];
            if (githubResult.isError) errors.push(`GitHub: ${githubResult.content[0].text}`);
            if (cloudResult.isError) errors.push(`Cloud: ${cloudResult.content[0].text}`);
            throw new Error(`Analysis failed: ${errors.join(', ')}`);
        }

        console.log("Phase 2: Synthesizing insights...");

        // Phase 2: Deep Analysis - Synthesize the results
        const githubContent = githubResult.content[0].text;
        const cloudContent = cloudResult.content[0].text;

        const synthesisPrompt = `Analyze and synthesize these two analyses to identify key insights:

GITHUB REPOSITORY ANALYSIS:
${githubContent}

CLOUD INFRASTRUCTURE ANALYSIS:
${cloudContent}

Focus areas: ${args.focus_areas?.join(', ') || 'general analysis'}

Provide a synthesis that identifies:
1. **Alignment Issues**: Where the repository and cloud infrastructure don't align
2. **Scaling Bottlenecks**: Potential issues for growth
3. **Architecture Gaps**: Missing components or suboptimal configurations
4. **Technology Mismatches**: Where repo tech stack doesn't match cloud setup
5. **Key Insights**: Important observations from combining both analyses`;

        const synthesis = await client.chatCompletion({
            messages: [
                {
                    role: "user",
                    content: synthesisPrompt
                }
            ],
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1500,
            temperature: 0.4,
            system: "You are a senior technical architect specializing in full-stack analysis. Identify critical insights by combining repository and infrastructure analysis."
        });

        console.log("Phase 3: Generating report sections...");

        // Phase 3: Generate Report Sections in Parallel
        const [executiveSummary, technicalDetails, recommendations] = await Promise.all([
            client.chatCompletion({
                messages: [
                    {
                        role: "user",
                        content: `Write an executive summary based on this analysis: ${synthesis}`
                    }
                ],
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 800,
                temperature: 0.3,
                system: "You are writing for executives. Focus on business impact, risks, and high-level recommendations."
            }),
            client.chatCompletion({
                messages: [
                    {
                        role: "user",
                        content: `Write technical details and findings based on this analysis: ${synthesis}`
                    }
                ],
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 1200,
                temperature: 0.3,
                system: "You are writing for technical teams. Include specific technical details, configurations, and implementation notes."
            }),
            client.chatCompletion({
                messages: [
                    {
                        role: "user",
                        content: `Write actionable recommendations based on this analysis: ${synthesis}`
                    }
                ],
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 1000,
                temperature: 0.3,
                system: "You are a solutions architect. Provide specific, actionable recommendations with priorities and implementation steps."
            })
        ]);

        console.log("Phase 4: Compiling final report...");

        // Phase 4: Compile Final Report
        const finalReportPrompt = `Compile these sections into a cohesive scaling advisory report:

EXECUTIVE SUMMARY:
${executiveSummary}

TECHNICAL DETAILS:
${technicalDetails}

RECOMMENDATIONS:
${recommendations}

Create a well-structured report with clear sections, priorities, and next steps for scaling this application.`;

        const finalReport = await client.chatCompletion({
            messages: [
                {
                    role: "user",
                    content: finalReportPrompt
                }
            ],
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 2048,
            temperature: 0.2,
            system: "You are a senior technical consultant creating a comprehensive scaling advisory report. Structure it professionally with clear sections and actionable insights."
        });

        return {
            content: [{ 
                type: "text", 
                text: `# Comprehensive Repository & Cloud Analysis Report\n\n${finalReport}` 
            }],
            isError: false,
        };

    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error in comprehensive analysis: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
