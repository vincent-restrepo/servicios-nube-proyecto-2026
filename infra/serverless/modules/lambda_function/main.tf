variable "lambda_name" {}
variable "lambda_handler" {}
variable "lambda_role_arn" {}
variable "lambda_zip_file" {}
variable "rds_endpoint" {}
variable "db_user" {}
variable "db_password" {}
variable "db_name" {}
variable "subnet_ids" {
  type = list(string)
}
variable "security_group_ids" {
  type = list(string)
}

# ----------------------------------------------------
# 1. FUNCIÓN LAMBDA
# ----------------------------------------------------
resource "aws_lambda_function" "this" {
  function_name    = var.lambda_name
  handler          = var.lambda_handler
  role             = var.lambda_role_arn
  runtime          = "python3.9"
  filename         = var.lambda_zip_file
  
  # Cálculo del hash: ASUMIMOS que el archivo ya existe
  source_code_hash = filebase64sha256(var.lambda_zip_file) 

  timeout          = 30
  memory_size      = 128

  # Configuración VPC (para acceso al RDS)
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }
  
  # Variables de Entorno para la conexión a la DB
  environment {
    variables = {
      RDS_ENDPOINT = var.rds_endpoint
      DB_USER      = var.db_user
      DB_PASSWORD  = var.db_password
      DB_NAME      = var.db_name
    }
  }
}

# ----------------------------------------------------
# 2. OUTPUTS
# ----------------------------------------------------
output "lambda_arn" {
  value = aws_lambda_function.this.arn
}

output "lambda_name" {
  value = aws_lambda_function.this.function_name
}