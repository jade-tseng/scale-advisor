import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ClaudeClient } from '../client.js';

/**
 * Arguments for security analysis tool
 */
export interface SecurityAnalysisArgs {
    repository_url?: string;
    analysis_scope?: 'iam' | 'secrets' | 'containers' | 'all';
    severity_threshold?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Tool definition for security analysis
 */
export const securityAnalyzerToolDefinition: Tool = {
    name: "analyze_security_posture",
    description: "Analyze security posture including IAM policies, secrets in code, and container security. Identifies common scaling security failure points and provides remediation recommendations.",
    inputSchema: {
        type: "object",
        properties: {
            repository_url: {
                type: "string",
                description: "Optional GitHub repository URL to analyze for secrets and security issues",
                default: "https://github.com/microsoft/vscode"
            },
            analysis_scope: {
                type: "string",
                enum: ["iam", "secrets", "containers", "all"],
                description: "Scope of security analysis (default: all)",
                default: "all"
            },
            severity_threshold: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "Minimum severity level to report (default: medium)",
                default: "medium"
            }
        }
    }
};

/**
 * Mock AWS security data generator
 */
function generateMockSecurityData() {
    return {
        iam: {
            policies: [
                {
                    name: "WebAppInstanceProfile",
                    arn: "arn:aws:iam::123456789012:role/WebAppInstanceProfile",
                    type: "role",
                    attachedPolicies: ["AmazonS3FullAccess", "AmazonRDSFullAccess"],
                    inlinePolicies: [
                        {
                            name: "CustomS3Access",
                            document: {
                                Version: "2012-10-17",
                                Statement: [
                                    {
                                        Effect: "Allow",
                                        Action: "s3:*",
                                        Resource: "*"
                                    }
                                ]
                            }
                        }
                    ],
                    lastUsed: "2024-01-15T10:30:00Z",
                    riskLevel: "HIGH"
                },
                {
                    name: "DatabaseAccessRole",
                    arn: "arn:aws:iam::123456789012:role/DatabaseAccessRole",
                    type: "role",
                    attachedPolicies: ["AmazonRDSDataFullAccess"],
                    inlinePolicies: [],
                    lastUsed: "2024-01-20T14:45:00Z",
                    riskLevel: "MEDIUM"
                },
                {
                    name: "AdminUser",
                    arn: "arn:aws:iam::123456789012:user/AdminUser",
                    type: "user",
                    attachedPolicies: ["AdministratorAccess"],
                    accessKeys: [
                        {
                            accessKeyId: "AKIA...",
                            status: "Active",
                            lastUsed: "2024-01-10T09:15:00Z",
                            lastRotated: "2023-06-15T12:00:00Z"
                        }
                    ],
                    riskLevel: "CRITICAL"
                }
            ],
            findings: [
                {
                    type: "OVERPRIVILEGED_ROLE",
                    severity: "HIGH",
                    resource: "WebAppInstanceProfile",
                    description: "Role has overly broad S3 permissions with wildcard resources"
                },
                {
                    type: "STALE_ACCESS_KEY",
                    severity: "MEDIUM",
                    resource: "AdminUser",
                    description: "Access key not rotated in 7+ months"
                },
                {
                    type: "ADMIN_USER_ACTIVE",
                    severity: "CRITICAL",
                    resource: "AdminUser",
                    description: "User with AdministratorAccess policy actively used"
                }
            ]
        },
        secrets: {
            codebaseFindings: [
                {
                    file: "src/config/database.js",
                    line: 15,
                    type: "DATABASE_PASSWORD",
                    severity: "CRITICAL",
                    pattern: "password: 'mySecretPassword123'",
                    recommendation: "Use AWS Secrets Manager or environment variables"
                },
                {
                    file: "deploy/docker-compose.yml",
                    line: 23,
                    type: "API_KEY",
                    severity: "HIGH",
                    pattern: "STRIPE_SECRET_KEY=sk_live_...",
                    recommendation: "Move to encrypted environment variables"
                },
                {
                    file: "src/utils/aws-client.ts",
                    line: 8,
                    type: "AWS_CREDENTIALS",
                    severity: "CRITICAL",
                    pattern: "accessKeyId: 'AKIA...'",
                    recommendation: "Use IAM roles instead of hardcoded credentials"
                }
            ],
            awsSecretsManager: {
                secrets: [
                    {
                        name: "prod/database/credentials",
                        arn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/database/credentials-AbCdEf",
                        lastRotated: "2024-01-01T00:00:00Z",
                        rotationEnabled: false,
                        riskLevel: "MEDIUM"
                    },
                    {
                        name: "prod/api/stripe-key",
                        arn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/api/stripe-key-GhIjKl",
                        lastRotated: "2023-12-15T00:00:00Z",
                        rotationEnabled: true,
                        riskLevel: "LOW"
                    }
                ]
            }
        },
        containers: {
            ecr: {
                repositories: [
                    {
                        name: "webapp-frontend",
                        uri: "123456789012.dkr.ecr.us-east-1.amazonaws.com/webapp-frontend",
                        imageCount: 15,
                        vulnerabilityFindings: [
                            {
                                severity: "CRITICAL",
                                count: 2,
                                description: "Critical vulnerabilities in base image"
                            },
                            {
                                severity: "HIGH",
                                count: 8,
                                description: "High severity package vulnerabilities"
                            }
                        ]
                    },
                    {
                        name: "webapp-backend",
                        uri: "123456789012.dkr.ecr.us-east-1.amazonaws.com/webapp-backend",
                        imageCount: 12,
                        vulnerabilityFindings: [
                            {
                                severity: "MEDIUM",
                                count: 5,
                                description: "Medium severity vulnerabilities"
                            }
                        ]
                    }
                ]
            },
            ecs: {
                services: [
                    {
                        name: "webapp-frontend-service",
                        taskDefinition: "webapp-frontend:15",
                        securityIssues: [
                            {
                                type: "PRIVILEGED_CONTAINER",
                                severity: "HIGH",
                                description: "Container running with privileged access"
                            },
                            {
                                type: "ROOT_USER",
                                severity: "MEDIUM",
                                description: "Container running as root user"
                            }
                        ]
                    }
                ]
            },
            dockerfiles: [
                {
                    path: "Dockerfile",
                    issues: [
                        {
                            line: 1,
                            type: "OUTDATED_BASE_IMAGE",
                            severity: "HIGH",
                            description: "Using outdated Node.js base image (node:14)",
                            recommendation: "Update to node:18-alpine or later"
                        },
                        {
                            line: 15,
                            type: "RUNNING_AS_ROOT",
                            severity: "MEDIUM",
                            description: "No USER directive found, container runs as root",
                            recommendation: "Add USER directive to run as non-root user"
                        }
                    ]
                }
            ]
        },
        compliance: {
            frameworks: ["SOC2", "PCI-DSS", "GDPR"],
            findings: [
                {
                    framework: "SOC2",
                    control: "CC6.1",
                    status: "NON_COMPLIANT",
                    severity: "HIGH",
                    description: "Logical access controls not properly implemented"
                },
                {
                    framework: "PCI-DSS",
                    control: "3.4",
                    status: "NON_COMPLIANT",
                    severity: "CRITICAL",
                    description: "Primary account number (PAN) not properly protected"
                }
            ]
        }
    };
}

/**
 * Handle security analysis tool execution
 */
export async function handleSecurityAnalyzerTool(
    claudeClient: ClaudeClient,
    args: SecurityAnalysisArgs
): Promise<CallToolResult> {
    try {
        const { repository_url, analysis_scope = 'all', severity_threshold = 'medium' } = args;

        console.log('🔒 Starting security analysis...');

        // Generate mock security data
        const securityData = generateMockSecurityData();

        // Create comprehensive security analysis prompt
        const analysisPrompt = `
Analyze the following AWS security posture data and provide a comprehensive security assessment:

REPOSITORY: ${repository_url || 'N/A'}
ANALYSIS SCOPE: ${analysis_scope}
SEVERITY THRESHOLD: ${severity_threshold}

IAM ANALYSIS:
${JSON.stringify(securityData.iam, null, 2)}

SECRETS ANALYSIS:
${JSON.stringify(securityData.secrets, null, 2)}

CONTAINER SECURITY:
${JSON.stringify(securityData.containers, null, 2)}

COMPLIANCE STATUS:
${JSON.stringify(securityData.compliance, null, 2)}

Please provide:
1. Executive Summary of security posture
2. Critical security risks and their business impact
3. Detailed findings by category (IAM, Secrets, Containers)
4. Prioritized remediation roadmap with timelines
5. Compliance gap analysis
6. Security scaling considerations for growth

Focus on issues that commonly cause scaling failures and security incidents in production environments.
`;

        const response = await claudeClient.chatCompletion({
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 2048,
            temperature: 0.3,
            system: "You are a senior security architect specializing in AWS security, DevSecOps, and compliance. Focus on practical, actionable security recommendations that prevent scaling failures."
        });

        return {
            content: [
                {
                    type: "text",
                    text: response
                }
            ]
        };

    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Security analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
            ],
            isError: true
        };
    }
}
