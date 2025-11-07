variable "lambda_name" {}
variable "lambda_handler" {}
variable "lambda_role_arn" {}
variable "lambda_zip_file" {}
variable "subnet_ids" {}
variable "security_group_ids" {}
variable "rds_endpoint" {}
variable "db_user" {}
variable "db_password" {}
variable "db_name" {}

resource "aws_lambda_function" "this" {
  function_name = var.lambda_name
  role          = var.lambda_role_arn
  handler       = var.lambda_handler
  runtime       = "python3.9"

  filename         = var.lambda_zip_file
  source_code_hash = filebase64sha256(var.lambda_zip_file)

  timeout = 10
  memory_size = 256

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = {
      DB_HOST     = var.rds_endpoint
      DB_USER     = var.db_user
      DB_PASSWORD = var.db_password
      DB_NAME     = var.db_name
    }
  }

  tags = {
    Name = var.lambda_name
    Force = "v2"
  }
}

output "lambda_arn" {
  value = aws_lambda_function.this.arn
}
