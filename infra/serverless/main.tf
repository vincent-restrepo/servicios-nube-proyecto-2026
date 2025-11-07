# infra/serverless/main.tf

# ======== IAM ROLE (LABROLE EXISTENTE) ========
data "aws_iam_role" "labrole" {
  name = "labrole"
}

# ======== PACKAGING DE LAMBDA ========
resource "archive_file" "listar_estudiantes_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/listar_estudiantes" 
  output_path = "${path.module}/listar_estudiantes.zip" # Guarda el ZIP en el directorio serverless
}

# ======== SECURITY GROUPS (SG de Lambda y regla de acceso al RDS) ========
module "security_groups" {
  source    = "../modules/security_groups"
  # REFERENCIA DINÁMICA: Lee el ID de la VPC y el SG del RDS del estado de la red
  vpc_id    = data.terraform_remote_state.red_base.outputs.vpc_id 
  rds_sg_id = data.terraform_remote_state.red_base.outputs.sg_rds_id 
}

# ======== LAMBDA FUNCTION ========
module "listar_lambda" {
  source = "../modules/lambda_function"

  lambda_name      = "listar_estudiantes"
  lambda_handler   = "app.lambda_handler"
  lambda_role_arn  = data.aws_iam_role.labrole.arn
  # Se ajusta la ruta del zip
  lambda_zip_file  = archive_file.listar_estudiantes_zip.output_path 

  # REFERENCIA DINÁMICA: Lee el Endpoint y Password del estado de la DB
  rds_endpoint     = data.terraform_remote_state.db_base.outputs.rds_endpoint
  db_user          = "nexa_admin"
  db_password      = data.terraform_remote_state.db_base.outputs.rds_master_password
  db_name          = "nexacloud"

  # REFERENCIA DINÁMICA: Lee las Subredes Privadas del estado de la red
  subnet_ids       = data.terraform_remote_state.red_base.outputs.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# ======== API GATEWAY ========
module "listar_api" {
  source     = "../modules/api_gateway"
  name       = "listar-estudiantes-api"
  lambda_arn = module.listar_lambda.lambda_arn
}

# ======== OUTPUT ========
output "listar_api_url" {
  value = module.listar_api.api_endpoint
}