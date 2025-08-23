# RDS Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group"
  subnet_ids = [aws_subnet.subnet_1.id, aws_subnet.subnet_2.id]

  tags = {
    Name = "Main DB subnet group"
  }
}

# RDS Instances

resource "aws_db_instance" "prod_postgres_main" {
  identifier = "prod-postgres-main"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "appdb"
  username = "dbadmin"
  password = "changeme123!"  # Use AWS Secrets Manager in production
  
  vpc_security_group_ids = [aws_security_group.sg_database_prod.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = true
  publicly_accessible    = false
  
  skip_final_snapshot = true  # Set to false in production
  
  tags = {
    Name = "prod-postgres-main"
    Environment = "production"
    Application = "database"
  }
}
