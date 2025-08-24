# Security Groups

resource "aws_security_group" "sg_web_prod" {
  name_prefix = "sg-web-prod"
  vpc_id      = aws_vpc.main.id

  
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
  }

  

  

  

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-web-prod"
  }
}

resource "aws_security_group" "sg_ssh_access" {
  name_prefix = "sg-ssh-access"
  vpc_id      = aws_vpc.main.id

  

  

  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production
  }

  

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-ssh-access"
  }
}

resource "aws_security_group" "sg_api_prod" {
  name_prefix = "sg-api-prod"
  vpc_id      = aws_vpc.main.id

  

  
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  

  

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-api-prod"
  }
}

resource "aws_security_group" "sg_staging" {
  name_prefix = "sg-staging"
  vpc_id      = aws_vpc.main.id

  

  

  

  

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-staging"
  }
}

resource "aws_security_group" "sg_database_prod" {
  name_prefix = "sg-database-prod"
  vpc_id      = aws_vpc.main.id

  

  

  

  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-database-prod"
  }
}
