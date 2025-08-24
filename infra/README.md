# Generated Terraform Infrastructure

This infrastructure was generated from mock AWS data using the Scale Advisor infra-gen tool.

## Resources Created

- **VPC**: Main VPC with public subnets
- **EC2 Instances**: 3 instances (2 running)
- **RDS Instances**: 1 database instances
- **Security Groups**: Configured for web, API, SSH, and database access

## Usage

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Plan the deployment:
   ```bash
   terraform plan
   ```

3. Apply the infrastructure:
   ```bash
   terraform apply
   ```

## Security Notes

⚠️ **Important**: This configuration is for development/testing purposes:

- RDS password is hardcoded (use AWS Secrets Manager in production)
- SSH access is open to 0.0.0.0/0 (restrict in production)
- Final snapshots are skipped (enable in production)

## Generated Files

- `providers.tf` - Terraform and AWS provider configuration
- `vpc.tf` - VPC, subnets, and networking
- `security_groups.tf` - Security group rules
- `ec2.tf` - EC2 instance configurations
- `rds.tf` - RDS database configurations
- `outputs.tf` - Output values for important resources
