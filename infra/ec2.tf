# EC2 Instances

resource "aws_instance" "web_server_prod" {
  ami           = "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI
  instance_type = "t3.medium"
  
  subnet_id                   = aws_subnet.subnet_1.id
  vpc_security_group_ids      = [aws_security_group.sg_web_prod.id, aws_security_group.sg_ssh_access.id]
  associate_public_ip_address = true
  
  

  tags = {
    Name = "web-server-prod"
    Environment = "production"
    Application = "frontend"
  }
}

resource "aws_instance" "api_server_prod" {
  ami           = "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI
  instance_type = "t3.large"
  
  subnet_id                   = aws_subnet.subnet_2.id
  vpc_security_group_ids      = [aws_security_group.sg_api_prod.id, aws_security_group.sg_ssh_access.id]
  associate_public_ip_address = true
  
  

  tags = {
    Name = "api-server-prod"
    Environment = "production"
    Application = "backend"
  }
}

resource "aws_instance" "staging_server" {
  ami           = "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI
  instance_type = "t3.small"
  
  subnet_id                   = aws_subnet.subnet_1.id
  vpc_security_group_ids      = [aws_security_group.sg_staging.id, aws_security_group.sg_ssh_access.id]
  associate_public_ip_address = false
  
  # This instance is currently stopped

  tags = {
    Name = "staging-server"
    Environment = "staging"
    Application = "testing"
  }
}
