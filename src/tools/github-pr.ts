import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ClaudeClient } from '../client.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Arguments for GitHub PR creation tool
 */
export interface GitHubPRArgs {
    repository_url: string;
    github_token?: string;
    branch_name?: string;
    pr_title?: string;
    pr_description?: string;
    infra_directory?: string;
}

/**
 * Tool definition for GitHub PR creation
 */
export const githubPRToolDefinition: Tool = {
    name: "create_github_pr",
    description: "Create a GitHub pull request with generated Terraform infrastructure code. Uploads files from infra-gen directory to a new branch and opens a PR.",
    inputSchema: {
        type: "object",
        properties: {
            repository_url: {
                type: "string",
                description: "GitHub repository URL (e.g., https://github.com/owner/repo)",
                default: "https://github.com/microsoft/vscode"
            },
            github_token: {
                type: "string",
                description: "GitHub Personal Access Token (or set GITHUB_TOKEN env var)"
            },
            branch_name: {
                type: "string",
                description: "Name for the new branch",
                default: "feature/terraform-infrastructure"
            },
            pr_title: {
                type: "string",
                description: "Pull request title",
                default: "Add Terraform Infrastructure Configuration"
            },
            pr_description: {
                type: "string",
                description: "Pull request description"
            },
            infra_directory: {
                type: "string",
                description: "Directory containing Terraform files to upload",
                default: "infra-gen"
            }
        },
        required: []
    }
};

/**
 * Interface for GitHub API responses
 */
interface GitHubRepo {
    owner: { login: string };
    name: string;
    default_branch: string;
}

interface GitHubRef {
    ref: string;
    object: { sha: string };
}

interface GitHubContent {
    name: string;
    path: string;
    sha?: string;
    content: string;
}

/**
 * Parse GitHub repository URL
 */
function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
}

/**
 * Make GitHub API request
 */
async function githubApiRequest(
    endpoint: string,
    token: string,
    method: string = 'GET',
    body?: any
): Promise<any> {
    const url = `https://api.github.com${endpoint}`;
    
    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Scale-Advisor-MCP'
        },
        ...(body && { body: JSON.stringify(body) })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${errorText}`);
    }

    return response.json();
}

/**
 * Get repository information
 */
async function getRepository(owner: string, repo: string, token: string): Promise<GitHubRepo> {
    return await githubApiRequest(`/repos/${owner}/${repo}`, token);
}

/**
 * Get the latest commit SHA from default branch
 */
async function getLatestCommitSha(owner: string, repo: string, branch: string, token: string): Promise<string> {
    const ref: GitHubRef = await githubApiRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token);
    return ref.object.sha;
}

/**
 * Create a new branch
 */
async function createBranch(owner: string, repo: string, branchName: string, baseSha: string, token: string): Promise<void> {
    await githubApiRequest(`/repos/${owner}/${repo}/git/refs`, token, 'POST', {
        ref: `refs/heads/${branchName}`,
        sha: baseSha
    });
}

/**
 * Upload file to GitHub repository
 */
async function uploadFile(
    owner: string,
    repo: string,
    filePath: string,
    content: string,
    branch: string,
    token: string,
    message: string
): Promise<void> {
    const encodedContent = Buffer.from(content).toString('base64');
    
    // Check if file already exists to get SHA for updates
    let existingSha: string | undefined;
    try {
        const existing: GitHubContent = await githubApiRequest(
            `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
            token
        );
        existingSha = existing.sha;
    } catch (error) {
        // File doesn't exist, that's fine
    }

    await githubApiRequest(`/repos/${owner}/${repo}/contents/${filePath}`, token, 'PUT', {
        message,
        content: encodedContent,
        branch,
        ...(existingSha && { sha: existingSha })
    });
}

/**
 * Create pull request
 */
async function createPullRequest(
    owner: string,
    repo: string,
    title: string,
    description: string,
    headBranch: string,
    baseBranch: string,
    token: string
): Promise<any> {
    return await githubApiRequest(`/repos/${owner}/${repo}/pulls`, token, 'POST', {
        title,
        body: description,
        head: headBranch,
        base: baseBranch
    });
}

/**
 * Generate PR description from Terraform files
 */
function generatePRDescription(infraDirectory: string): string {
    const files = fs.readdirSync(infraDirectory).filter(f => f.endsWith('.tf') || f === 'README.md');
    
    return `## 🏗️ Terraform Infrastructure Configuration

This PR adds Terraform configuration files generated by Scale Advisor to manage AWS infrastructure as code.

### 📁 Files Added

${files.map(file => `- \`${file}\``).join('\n')}

### 🚀 Infrastructure Overview

- **Provider**: AWS (Terraform ~> 5.0)
- **Region**: us-east-1
- **Resources**: EC2 instances, RDS database, VPC, Security Groups

### 📋 Deployment Instructions

1. **Initialize Terraform**:
   \`\`\`bash
   cd infra-gen/
   terraform init
   \`\`\`

2. **Review the plan**:
   \`\`\`bash
   terraform plan
   \`\`\`

3. **Apply infrastructure**:
   \`\`\`bash
   terraform apply
   \`\`\`

### ⚠️ Security Notes

**Important**: Review and update the following before production deployment:

- [ ] Update RDS password (currently hardcoded - use AWS Secrets Manager)
- [ ] Restrict SSH access from 0.0.0.0/0 to specific IP ranges
- [ ] Enable final snapshots for RDS instances
- [ ] Review security group rules for least privilege access
- [ ] Configure proper backup and monitoring

### 🔍 Generated by Scale Advisor

This infrastructure configuration was automatically generated based on analysis of:
- Repository architecture and requirements
- Cloud resource analysis
- Security best practices
- Scaling recommendations

---

**Next Steps**: After merging, set up your AWS credentials and deploy using the instructions above.`;
}

/**
 * Handle GitHub PR creation tool execution
 */
export async function handleGitHubPRTool(
    claudeClient: ClaudeClient,
    args: GitHubPRArgs | undefined
): Promise<CallToolResult> {
    try {
        // Provide defaults if no args provided
        const safeArgs: GitHubPRArgs = {
            repository_url: args?.repository_url || "https://github.com/microsoft/vscode",
            github_token: args?.github_token || process.env.GITHUB_TOKEN,
            branch_name: args?.branch_name || "feature/terraform-infrastructure",
            pr_title: args?.pr_title || "Add Terraform Infrastructure Configuration",
            pr_description: args?.pr_description,
            infra_directory: args?.infra_directory || "infra-gen"
        };

        console.log('🔀 Starting GitHub PR creation...');

        // Validate GitHub token
        if (!safeArgs.github_token) {
            throw new Error('GitHub token is required. Set GITHUB_TOKEN environment variable or provide github_token parameter.');
        }

        // Parse repository URL
        const repoInfo = parseGitHubRepoUrl(safeArgs.repository_url);
        if (!repoInfo) {
            throw new Error('Invalid GitHub repository URL. Expected format: https://github.com/owner/repo');
        }

        // Check if infra directory exists
        const infraPath = path.resolve(safeArgs.infra_directory!);
        if (!fs.existsSync(infraPath)) {
            throw new Error(`Infrastructure directory not found: ${infraPath}. Run the infra-gen tool first.`);
        }

        console.log(`📁 Repository: ${repoInfo.owner}/${repoInfo.repo}`);
        console.log(`🌿 Branch: ${safeArgs.branch_name}`);

        // Get repository information
        const repository = await getRepository(repoInfo.owner, repoInfo.repo, safeArgs.github_token!);
        console.log(`✅ Repository found: ${repository.name}`);

        // Get latest commit SHA from default branch
        const latestSha = await getLatestCommitSha(
            repoInfo.owner, 
            repoInfo.repo, 
            repository.default_branch, 
            safeArgs.github_token!
        );

        // Create new branch
        try {
            await createBranch(repoInfo.owner, repoInfo.repo, safeArgs.branch_name!, latestSha, safeArgs.github_token!);
            console.log(`✅ Created branch: ${safeArgs.branch_name}`);
        } catch (error) {
            if (error instanceof Error && error.message.includes('422')) {
                console.log(`ℹ️ Branch ${safeArgs.branch_name} already exists, updating files...`);
            } else {
                throw error;
            }
        }

        // Upload all files from infra directory
        const files = fs.readdirSync(infraPath);
        const uploadedFiles: string[] = [];

        for (const file of files) {
            const filePath = path.join(infraPath, file);
            if (fs.statSync(filePath).isFile()) {
                const content = fs.readFileSync(filePath, 'utf8');
                const githubPath = `infra/${file}`;  // Upload to infra/ directory in repo
                
                await uploadFile(
                    repoInfo.owner,
                    repoInfo.repo,
                    githubPath,
                    content,
                    safeArgs.branch_name!,
                    safeArgs.github_token!,
                    `Add ${file} - Terraform infrastructure configuration`
                );
                
                uploadedFiles.push(githubPath);
                console.log(`✅ Uploaded: ${githubPath}`);
            }
        }

        // Generate PR description if not provided
        const prDescription = safeArgs.pr_description || generatePRDescription(infraPath);

        // Create pull request
        const pullRequest = await createPullRequest(
            repoInfo.owner,
            repoInfo.repo,
            safeArgs.pr_title!,
            prDescription,
            safeArgs.branch_name!,
            repository.default_branch,
            safeArgs.github_token!
        );

        console.log(`✅ Pull request created: #${pullRequest.number}`);

        const summary = `🎉 Successfully created GitHub pull request!

📋 **Pull Request Details:**
- **Repository**: ${repoInfo.owner}/${repoInfo.repo}
- **PR Number**: #${pullRequest.number}
- **Branch**: ${safeArgs.branch_name}
- **Title**: ${safeArgs.pr_title}
- **URL**: ${pullRequest.html_url}

📁 **Files Uploaded**: ${uploadedFiles.length} files
${uploadedFiles.map(file => `- ${file}`).join('\n')}

🔗 **Next Steps:**
1. Review the PR: ${pullRequest.html_url}
2. Merge when ready
3. Deploy infrastructure: \`cd infra && terraform init && terraform apply\`

⚠️ **Security Reminder**: Review security settings before production deployment!`;

        return {
            content: [
                {
                    type: "text",
                    text: summary
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `GitHub PR creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
            ],
            isError: true
        };
    }
}
