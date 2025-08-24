# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}


output "web_server_prod_public_ip" {
  description = "Public IP address of web-server-prod"
  value       = aws_instance.web_server_prod.public_ip
}

output "api_server_prod_public_ip" {
  description = "Public IP address of api-server-prod"
  value       = aws_instance.api_server_prod.public_ip
}

output "staging_server_public_ip" {
  description = "Public IP address of staging-server"
  value       = aws_instance.staging_server.public_ip
}


output "prod_postgres_main_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.prod_postgres_main.endpoint
}
