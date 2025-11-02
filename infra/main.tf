provider "aws" {
  region = "us-east-1"
}

# ======== SECURITY GROUPS ========
module "security_groups" {
  source    = "./modules/security_groups"
  vpc_id    = "vpc-0d95bda27a2680ee4"
  rds_sg_id = "sg-05a30c896ef85193c"
}

# ======== IAM ROLE (LABROLE EXISTENTE) ========
data "aws_iam_role" "labrole" {
  name = "labrole"
}

# ======== LAMBDA FUNCTION ========
module "listar_lambda" {
  source = "./modules/lambda_function"

  lambda_name      = "listar_estudiantes"
  lambda_handler   = "app.lambda_handler"
  lambda_role_arn  = data.aws_iam_role.labrole.arn
  lambda_zip_file  = "${path.module}/lambda/listar_estudiantes.zip"

  rds_endpoint = "nexa-db-instance.cpe8ueqa8eqm.us-east-1.rds.amazonaws.com"
  db_user      = "nexa_admin"
  db_password  = "&ix6(6jIJyC7h+DM"
  db_name      = "nexacloud"

  subnet_ids         = ["subnet-06b410ed8346d7a86", "subnet-0fc351a932d92cf97"]
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# ======== API GATEWAY ========
module "listar_api" {
  source     = "./modules/api_gateway"
  name       = "listar-estudiantes-api"
  lambda_arn = module.listar_lambda.lambda_arn
}

# ======== OUTPUT ========
output "listar_api_url" {
  value = module.listar_api.api_endpoint
}
