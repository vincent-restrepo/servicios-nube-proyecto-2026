resource "aws_security_group" "lambda_sg" {
  name        = "nexa-lambda-sg"
  description = "Security Group para Lambda que accede al RDS"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "nexa-lambda-sg"
  }
}

# Permitir que la Lambda acceda al RDS
resource "aws_security_group_rule" "allow_lambda_to_rds" {
  type                     = "ingress"
  from_port                = 9876
  to_port                  = 9876
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda_sg.id
  security_group_id        = var.rds_sg_id
  description              = "Permitir acceso de Lambda al RDS"
}
