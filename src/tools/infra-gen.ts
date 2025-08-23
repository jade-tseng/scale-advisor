import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ClaudeClient } from '../client.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Arguments for infrastructure generation tool
 */
export interface InfraGenArgs {
    input_file?: string;
    output_directory?: string;
    terraform_version?: string;
    provider_version?: string;
}

/**
 * Tool definition for infrastructure code generation
 */
export const infraGenToolDefinition: Tool = {
    name: "generate_terraform_infrastructure",
    description: "Generate Terraform infrastructure code from AWS resource mock data. Creates properly structured .tf files for EC2 instances, RDS databases, VPCs, and security groups.",
    inputSchema: {
        type: "object",
        properties: {
            input_file: {
                type: "string",
                description: "Path to JSON file containing AWS resource data",
                default: "mockdata.json"
            },
            output_directory: {
                type: "string", 
                description: "Directory to output Terraform files",
                default: "infra-gen"
            },
            terraform_version: {
                type: "string",
                description: "Terraform version constraint",
                default: ">= 1.0"
            },
            provider_version: {
                type: "string",
                description: "AWS provider version constraint", 
                default: "~> 5.0"
            }
        },
        required: []
    }
};

/**
 * Interface for mock data structure
 */
interface MockCloudData {
    region: string;
    accountId: string;
    ec2Instances: Array<{
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
    }>;
    rdsInstances: Array<{
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
    }>;
}

/**
 * Generate Terraform provider configuration
 */
function generateProviderConfig(region: string, terraformVersion: string, providerVersion: string): string {
    return `terraform {
  required_version = "${terraformVersion}"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "${providerVersion}"
    }
  }
}

provider "aws" {
  region = "${region}"
  
  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = "ScaleAdvisor"
    }
  }
}
`;
}

/**
 * Generate VPC and networking resources
 */
function generateVPCConfig(data: MockCloudData): string {
    const uniqueVpcs = [...new Set(data.ec2Instances.map(i => i.vpcId))];
    const uniqueSubnets = [...new Set(data.ec2Instances.map(i => ({ id: i.subnetId, az: i.availabilityZone })))];
    
    return `# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

# Subnets
${uniqueSubnets.map((subnet, index) => `
resource "aws_subnet" "subnet_${index + 1}" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${index + 1}.0/24"
  availability_zone       = "${subnet.az}"
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-${index + 1}"
  }
}`).join('\n')}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt"
  }
}

${uniqueSubnets.map((_, index) => `
resource "aws_route_table_association" "public_${index + 1}" {
  subnet_id      = aws_subnet.subnet_${index + 1}.id
  route_table_id = aws_route_table.public.id
}`).join('\n')}
`;
}

/**
 * Generate security group configurations
 */
function generateSecurityGroups(data: MockCloudData): string {
    const allSecurityGroups = new Set<string>();
    data.ec2Instances.forEach(instance => {
        instance.securityGroups.forEach(sg => allSecurityGroups.add(sg));
    });
    data.rdsInstances.forEach(instance => {
        instance.securityGroups.forEach(sg => allSecurityGroups.add(sg));
    });

    return `# Security Groups
${Array.from(allSecurityGroups).map((sg) => `
resource "aws_security_group" "${sg.replace(/-/g, '_')}" {
  name_prefix = "${sg}"
  vpc_id      = aws_vpc.main.id

  ${sg.includes('web') ? `
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }` : ''}

  ${(sg as string).includes('api') ? `
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }` : ''}

  ${(sg as string).includes('ssh') ? `
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production
  }` : ''}

  ${(sg as string).includes('database') ? `
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }` : ''}

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${sg as string}"
  }
}`).join('\n')}
`;
}

/**
 * Generate EC2 instance configurations
 */
function generateEC2Config(data: MockCloudData): string {
    return `# EC2 Instances
${data.ec2Instances.map((instance, index) => {
        const subnetIndex = data.ec2Instances.findIndex(i => i.subnetId === instance.subnetId) + 1;
        return `
resource "aws_instance" "${instance.tags.Name?.replace(/-/g, '_') || `instance_${index}`}" {
  ami           = "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI
  instance_type = "${instance.instanceType}"
  
  subnet_id                   = aws_subnet.subnet_${subnetIndex}.id
  vpc_security_group_ids      = [${instance.securityGroups.map(sg => `aws_security_group.${sg.replace(/-/g, '_')}.id`).join(', ')}]
  associate_public_ip_address = ${instance.publicIpAddress ? 'true' : 'false'}
  
  ${instance.state === 'stopped' ? '# This instance is currently stopped' : ''}

  tags = {
${Object.entries(instance.tags).map(([key, value]) => `    ${key} = "${value}"`).join('\n')}
  }
}`;
    }).join('\n')}
`;
}

/**
 * Generate RDS configurations
 */
function generateRDSConfig(data: MockCloudData): string {
    return `# RDS Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group"
  subnet_ids = [aws_subnet.subnet_1.id, aws_subnet.subnet_2.id]

  tags = {
    Name = "Main DB subnet group"
  }
}

# RDS Instances
${data.rdsInstances.map((instance, index) => `
resource "aws_db_instance" "${instance.dbInstanceIdentifier.replace(/-/g, '_')}" {
  identifier = "${instance.dbInstanceIdentifier}"
  
  engine         = "${instance.engine}"
  engine_version = "${instance.engineVersion}"
  instance_class = "${instance.dbInstanceClass}"
  
  allocated_storage     = ${instance.allocatedStorage}
  storage_type          = "${instance.storageType}"
  storage_encrypted     = true
  
  db_name  = "appdb"
  username = "dbadmin"
  password = "changeme123!"  # Use AWS Secrets Manager in production
  
  vpc_security_group_ids = [${instance.securityGroups.map(sg => `aws_security_group.${sg.replace(/-/g, '_')}.id`).join(', ')}]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = ${instance.backupRetentionPeriod}
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = ${instance.multiAZ}
  publicly_accessible    = false
  
  skip_final_snapshot = true  # Set to false in production
  
  tags = {
${Object.entries(instance.tags).map(([key, value]) => `    ${key} = "${value}"`).join('\n')}
  }
}`).join('\n')}
`;
}

/**
 * Generate outputs configuration
 */
function generateOutputsConfig(data: MockCloudData): string {
    return `# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

${data.ec2Instances.map((instance, index) => `
output "${(instance.tags.Name || `instance_${index}`).replace(/-/g, '_')}_public_ip" {
  description = "Public IP address of ${instance.tags.Name || `instance ${index}`}"
  value       = aws_instance.${(instance.tags.Name || `instance_${index}`).replace(/-/g, '_')}.public_ip
}`).join('\n')}

${data.rdsInstances.map(instance => `
output "${instance.dbInstanceIdentifier.replace(/-/g, '_')}_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.${instance.dbInstanceIdentifier.replace(/-/g, '_')}.endpoint
}`).join('\n')}
`;
}

/**
 * Handle infrastructure generation tool execution
 */
export async function handleInfraGenTool(
    claudeClient: ClaudeClient,
    args: InfraGenArgs | undefined
): Promise<CallToolResult> {
    try {
        // Provide defaults if no args provided
        const safeArgs: InfraGenArgs = {
            input_file: args?.input_file || "mockdata.json",
            output_directory: args?.output_directory || "infra-gen",
            terraform_version: args?.terraform_version || ">= 1.0",
            provider_version: args?.provider_version || "~> 5.0"
        };

        console.log('🏗️ Starting Terraform infrastructure generation...');

        // Read mock data
        const inputPath = path.resolve(safeArgs.input_file!);
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file not found: ${inputPath}`);
        }

        const mockData: MockCloudData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        
        // Ensure output directory exists
        const outputDir = path.resolve(safeArgs.output_directory!);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate Terraform files
        const files = [
            {
                name: 'providers.tf',
                content: generateProviderConfig(mockData.region, safeArgs.terraform_version!, safeArgs.provider_version!)
            },
            {
                name: 'vpc.tf',
                content: generateVPCConfig(mockData)
            },
            {
                name: 'security_groups.tf',
                content: generateSecurityGroups(mockData)
            },
            {
                name: 'ec2.tf',
                content: generateEC2Config(mockData)
            },
            {
                name: 'rds.tf',
                content: generateRDSConfig(mockData)
            },
            {
                name: 'outputs.tf',
                content: generateOutputsConfig(mockData)
            }
        ];

        // Write all files
        files.forEach(file => {
            const filePath = path.join(outputDir, file.name);
            fs.writeFileSync(filePath, file.content);
            console.log(`✅ Generated: ${file.name}`);
        });

        // Generate README
        const readmeContent = `# Generated Terraform Infrastructure

This infrastructure was generated from mock AWS data using the Scale Advisor infra-gen tool.

## Resources Created

- **VPC**: Main VPC with public subnets
- **EC2 Instances**: ${mockData.ec2Instances.length} instances (${mockData.ec2Instances.filter(i => i.state === 'running').length} running)
- **RDS Instances**: ${mockData.rdsInstances.length} database instances
- **Security Groups**: Configured for web, API, SSH, and database access

## Usage

1. Initialize Terraform:
   \`\`\`bash
   terraform init
   \`\`\`

2. Plan the deployment:
   \`\`\`bash
   terraform plan
   \`\`\`

3. Apply the infrastructure:
   \`\`\`bash
   terraform apply
   \`\`\`

## Security Notes

⚠️ **Important**: This configuration is for development/testing purposes:

- RDS password is hardcoded (use AWS Secrets Manager in production)
- SSH access is open to 0.0.0.0/0 (restrict in production)
- Final snapshots are skipped (enable in production)

## Generated Files

- \`providers.tf\` - Terraform and AWS provider configuration
- \`vpc.tf\` - VPC, subnets, and networking
- \`security_groups.tf\` - Security group rules
- \`ec2.tf\` - EC2 instance configurations
- \`rds.tf\` - RDS database configurations
- \`outputs.tf\` - Output values for important resources
`;

        fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);
        console.log(`✅ Generated: README.md`);

        const summary = `Successfully generated Terraform infrastructure code from ${safeArgs.input_file}

📁 Output Directory: ${safeArgs.output_directory}/
📄 Files Generated: ${files.length + 1} files

🏗️ Infrastructure Summary:
- Region: ${mockData.region}
- EC2 Instances: ${mockData.ec2Instances.length}
- RDS Instances: ${mockData.rdsInstances.length}
- Security Groups: ${new Set([...mockData.ec2Instances.flatMap(i => i.securityGroups), ...mockData.rdsInstances.flatMap(i => i.securityGroups)]).size}

Next Steps:
1. cd ${safeArgs.output_directory}
2. terraform init
3. terraform plan
4. terraform apply

⚠️ Review security settings before deploying to production!`;

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
                    text: `Infrastructure generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
            ],
            isError: true
        };
    }
}
