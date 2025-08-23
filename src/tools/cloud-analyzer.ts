import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ClaudeClient } from '../client.js';

/**
 * Mock AWS resource data
 */
interface EC2Instance {
    instanceId: string;
    instanceType: string;
    state: string;
    availabilityZone: string;
    publicIpAddress?: string;
    privateIpAddress: string;
    launchTime: string;
    tags: Record<string, string>;
    securityGroups: string[];
    vpcId: string;
    subnetId: string;
}

interface RDSInstance {
    dbInstanceIdentifier: string;
    dbInstanceClass: string;
    engine: string;
    engineVersion: string;
    dbInstanceStatus: string;
    availabilityZone: string;
    endpoint: {
        address: string;
        port: number;
    };
    allocatedStorage: number;
    storageType: string;
    multiAZ: boolean;
    vpcId: string;
    subnetGroupName: string;
    securityGroups: string[];
    backupRetentionPeriod: number;
    tags: Record<string, string>;
}

interface CloudResources {
    ec2Instances: EC2Instance[];
    rdsInstances: RDSInstance[];
    region: string;
    accountId: string;
}

/**
 * Arguments for cloud analyzer tool
 */
export interface CloudAnalyzerArgs {
    analysis_type?: 'overview' | 'detailed' | 'security' | 'cost';
    include_recommendations?: boolean;
}

/**
 * Generate mock AWS resources
 */
function generateMockCloudResources(): CloudResources {
    return {
        region: 'us-east-1',
        accountId: '123456789012',
        ec2Instances: [
            {
                instanceId: 'i-0123456789abcdef0',
                instanceType: 't3.medium',
                state: 'running',
                availabilityZone: 'us-east-1a',
                publicIpAddress: '54.123.45.67',
                privateIpAddress: '10.0.1.100',
                launchTime: '2024-08-20T10:30:00Z',
                tags: {
                    Name: 'web-server-prod',
                    Environment: 'production',
                    Application: 'frontend'
                },
                securityGroups: ['sg-web-prod', 'sg-ssh-access'],
                vpcId: 'vpc-12345678',
                subnetId: 'subnet-12345678'
            },
            {
                instanceId: 'i-0987654321fedcba0',
                instanceType: 't3.large',
                state: 'running',
                availabilityZone: 'us-east-1b',
                publicIpAddress: '54.123.45.68',
                privateIpAddress: '10.0.2.100',
                launchTime: '2024-08-18T14:15:00Z',
                tags: {
                    Name: 'api-server-prod',
                    Environment: 'production',
                    Application: 'backend'
                },
                securityGroups: ['sg-api-prod', 'sg-ssh-access'],
                vpcId: 'vpc-12345678',
                subnetId: 'subnet-87654321'
            },
            {
                instanceId: 'i-0abcdef123456789',
                instanceType: 't3.small',
                state: 'stopped',
                availabilityZone: 'us-east-1a',
                privateIpAddress: '10.0.1.101',
                launchTime: '2024-08-15T09:00:00Z',
                tags: {
                    Name: 'staging-server',
                    Environment: 'staging',
                    Application: 'testing'
                },
                securityGroups: ['sg-staging', 'sg-ssh-access'],
                vpcId: 'vpc-12345678',
                subnetId: 'subnet-12345678'
            }
        ],
        rdsInstances: [
            {
                dbInstanceIdentifier: 'prod-postgres-main',
                dbInstanceClass: 'db.t3.medium',
                engine: 'postgres',
                engineVersion: '15.4',
                dbInstanceStatus: 'available',
                availabilityZone: 'us-east-1a',
                endpoint: {
                    address: 'prod-postgres-main.c123456789.us-east-1.rds.amazonaws.com',
                    port: 5432
                },
                allocatedStorage: 100,
                storageType: 'gp3',
                multiAZ: true,
                vpcId: 'vpc-12345678',
                subnetGroupName: 'prod-db-subnet-group',
                securityGroups: ['sg-database-prod'],
                backupRetentionPeriod: 7,
                tags: {
                    Name: 'prod-postgres-main',
                    Environment: 'production',
                    Application: 'database'
                }
            }
        ]
    };
}

/**
 * Tool definition for cloud resource analysis
 */
export const cloudAnalyzerToolDefinition: Tool = {
    name: "analyze_cloud_resources",
    description: "Analyze AWS cloud resources including EC2 instances and RDS databases. Provides insights on resource utilization, security, and cost optimization opportunities.",
    inputSchema: {
        type: "object",
        properties: {
            analysis_type: {
                type: "string",
                enum: ["overview", "detailed", "security", "cost"],
                description: "Type of analysis to perform (default: overview)",
                default: "overview"
            },
            include_recommendations: {
                type: "boolean",
                description: "Whether to include optimization recommendations (default: true)",
                default: true
            }
        },
        required: [],
    },
};

/**
 * Type guard for cloud analyzer arguments
 */
function isCloudAnalyzerArgs(args: unknown): args is CloudAnalyzerArgs {
    if (!args || typeof args !== "object") return true; // Allow empty args
    
    const typedArgs = args as Record<string, unknown>;
    
    if ('analysis_type' in typedArgs) {
        const validTypes = ['overview', 'detailed', 'security', 'cost'];
        if (!validTypes.includes(typedArgs.analysis_type as string)) {
            return false;
        }
    }
    
    if ('include_recommendations' in typedArgs) {
        if (typeof typedArgs.include_recommendations !== 'boolean') {
            return false;
        }
    }
    
    return true;
}

/**
 * Generate analysis prompt based on resources and parameters
 */
function generateAnalysisPrompt(resources: CloudResources, args: CloudAnalyzerArgs): string {
    const analysisType = args.analysis_type || 'overview';
    const includeRecommendations = args.include_recommendations !== false;
    
    let prompt = `Analyze the following AWS cloud resources in region ${resources.region} for account ${resources.accountId}:\n\n`;
    
    // Add EC2 instances
    prompt += `**EC2 Instances (${resources.ec2Instances.length}):**\n`;
    resources.ec2Instances.forEach(instance => {
        prompt += `- ${instance.instanceId} (${instance.instanceType})\n`;
        prompt += `  State: ${instance.state}\n`;
        prompt += `  AZ: ${instance.availabilityZone}\n`;
        prompt += `  Tags: ${JSON.stringify(instance.tags)}\n`;
        prompt += `  Security Groups: ${instance.securityGroups.join(', ')}\n\n`;
    });
    
    // Add RDS instances
    prompt += `**RDS Instances (${resources.rdsInstances.length}):**\n`;
    resources.rdsInstances.forEach(db => {
        prompt += `- ${db.dbInstanceIdentifier} (${db.dbInstanceClass})\n`;
        prompt += `  Engine: ${db.engine} ${db.engineVersion}\n`;
        prompt += `  Status: ${db.dbInstanceStatus}\n`;
        prompt += `  Storage: ${db.allocatedStorage}GB ${db.storageType}\n`;
        prompt += `  Multi-AZ: ${db.multiAZ}\n`;
        prompt += `  Backup Retention: ${db.backupRetentionPeriod} days\n\n`;
    });
    
    // Add analysis instructions based on type
    switch (analysisType) {
        case 'detailed':
            prompt += `Provide a detailed analysis including:
1. **Resource Inventory**: Complete breakdown of all resources
2. **Architecture Overview**: How resources are connected and organized
3. **Performance Characteristics**: Instance types, storage, and capacity
4. **Network Configuration**: VPC, subnets, security groups
5. **Operational Status**: Current state and health of resources`;
            break;
            
        case 'security':
            prompt += `Focus on security analysis:
1. **Security Groups**: Review firewall rules and access patterns
2. **Network Security**: VPC configuration and isolation
3. **Access Control**: Public vs private resources
4. **Database Security**: RDS security configuration
5. **Compliance**: Best practices adherence`;
            break;
            
        case 'cost':
            prompt += `Focus on cost optimization:
1. **Instance Sizing**: Right-sizing opportunities
2. **Resource Utilization**: Underutilized or idle resources
3. **Storage Optimization**: Storage type and size recommendations
4. **Reserved Instances**: Potential savings opportunities
5. **Cost Estimation**: Approximate monthly costs`;
            break;
            
        default: // overview
            prompt += `Provide an overview analysis including:
1. **Resource Summary**: What resources exist and their purpose
2. **Environment Classification**: Production, staging, development resources
3. **Key Observations**: Notable configurations or patterns
4. **Health Status**: Overall system health and availability`;
    }
    
    if (includeRecommendations) {
        prompt += `\n\n**Recommendations**: Provide actionable recommendations for:
- Performance improvements
- Cost optimization
- Security enhancements
- Operational best practices`;
    }
    
    return prompt;
}

/**
 * Handles cloud analyzer tool calls
 */
export async function handleCloudAnalyzerTool(
    client: ClaudeClient, 
    args: unknown
): Promise<CallToolResult> {
    try {
        if (!isCloudAnalyzerArgs(args)) {
            throw new Error("Invalid arguments for analyze_cloud_resources");
        }
        
        const typedArgs = (args as CloudAnalyzerArgs) || {};
        
        // Generate mock cloud resources
        const resources = generateMockCloudResources();
        
        // Generate analysis prompt
        const analysisPrompt = generateAnalysisPrompt(resources, typedArgs);
        
        // Use Claude to analyze the resources
        const result = await client.chatCompletion({
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 2048,
            temperature: 0.3, // Lower temperature for more factual analysis
            system: "You are a senior cloud architect and DevOps expert specializing in AWS infrastructure analysis. Provide detailed, actionable insights about cloud resources, focusing on best practices, security, performance, and cost optimization. Use clear formatting with headers and bullet points."
        });
        
        return {
            content: [{ 
                type: "text", 
                text: `# AWS Cloud Resources Analysis\n\n${result}` 
            }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error analyzing cloud resources: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}