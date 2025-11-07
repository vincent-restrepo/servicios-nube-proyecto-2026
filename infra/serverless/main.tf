# infra/serverless/main.tf

# ----------------------------------------------------
# 1. IAM ROLE (Recupera el rol que Lambda debe usar)
# ----------------------------------------------------
data "aws_iam_role" "labrole" {
  name = "labrole"
}

# ----------------------------------------------------
# 2. PACKAGING DE CÓDIGO (Crea los archivos .zip para las 3 funciones)
# ----------------------------------------------------

# Listar Estudiantes (GET /estudiantes)
resource "archive_file" "listar_estudiantes_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/listar_estudiantes" 
  output_path = "${path.module}/listar_estudiantes.zip" 
}

# Añadir Estudiante (POST /estudiantes)
resource "archive_file" "añadir_estudiante_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/añadir_estudiante" 
  output_path = "${path.module}/añadir_estudiante.zip" 
}

# Eliminar Estudiante (DELETE /estudiantes/{id})
resource "archive_file" "eliminar_estudiante_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/eliminar_estudiante" 
  output_path = "${path.module}/eliminar_estudiante.zip" 
}

# ----------------------------------------------------
# 3. SECURITY GROUPS (Crea el SG para Lambda y regla al RDS)
# ----------------------------------------------------
module "security_groups" {
  source    = "../modules/security_groups"
  # REFERENCIA DINÁMICA: Lee el ID de la VPC y el SG del RDS del estado de la red
  vpc_id    = data.terraform_remote_state.red_base.outputs.vpc_id 
  rds_sg_id = data.terraform_remote_state.red_base.outputs.sg_rds_id 
}

# ----------------------------------------------------
# 4. DESPLIEGUE DE FUNCIONES LAMBDA (3 funciones)
# ----------------------------------------------------

# A. Función para Listar Estudiantes
module "listar_lambda" {
  source = "../modules/lambda_function"

  lambda_name        = "nexa-listar-estudiantes"
  lambda_handler     = "app.lambda_handler"
  lambda_role_arn    = data.aws_iam_role.labrole.arn
  lambda_zip_file    = archive_file.listar_estudiantes_zip.output_path 

  # REFERENCIA DINÁMICA: Credenciales y Endpoint de la DB
  rds_endpoint       = data.terraform_remote_state.db_base.outputs.rds_endpoint
  db_user            = "nexa_admin"
  db_password        = data.terraform_remote_state.db_base.outputs.rds_master_password
  db_name            = "nexacloud"

  # REFERENCIA DINÁMICA: Subredes privadas de la red base
  subnet_ids         = data.terraform_remote_state.red_base.outputs.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# B. Función para Añadir Estudiantes
module "añadir_lambda" {
  source = "../modules/lambda_function"

  lambda_name        = "nexa-añadir-estudiantes"
  lambda_handler     = "app.lambda_handler"
  lambda_role_arn    = data.aws_iam_role.labrole.arn
  lambda_zip_file    = archive_file.añadir_estudiante_zip.output_path 

  rds_endpoint       = data.terraform_remote_state.db_base.outputs.rds_endpoint
  db_user            = "nexa_admin"
  db_password        = data.terraform_remote_state.db_base.outputs.rds_master_password
  db_name            = "nexacloud"

  subnet_ids         = data.terraform_remote_state.red_base.outputs.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# C. Función para Eliminar Estudiantes
module "eliminar_lambda" {
  source = "../modules/lambda_function"

  lambda_name        = "nexa-eliminar-estudiantes"
  lambda_handler     = "app.lambda_handler"
  lambda_role_arn    = data.aws_iam_role.labrole.arn
  lambda_zip_file    = archive_file.eliminar_estudiante_zip.output_path 

  rds_endpoint       = data.terraform_remote_state.db_base.outputs.rds_endpoint
  db_user            = "nexa_admin"
  db_password        = data.terraform_remote_state.db_base.outputs.rds_master_password
  db_name            = "nexacloud"

  subnet_ids         = data.terraform_remote_state.red_base.outputs.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# ----------------------------------------------------
# 5. API GATEWAY (3 APIs usando el módulo refactorizado)
# ----------------------------------------------------

# A. API para Listar Estudiantes
module "listar_api" {
  source     = "../modules/api_gateway"
  name       = "nexa-listar-api"
  lambda_arn = module.listar_lambda.lambda_arn
  route_key  = "GET /estudiantes"
}

# B. API para Añadir Estudiantes
module "añadir_api" {
  source     = "../modules/api_gateway"
  name       = "nexa-añadir-api"
  lambda_arn = module.añadir_lambda.lambda_arn
  route_key  = "POST /estudiantes"
}

# C. API para Eliminar Estudiantes
module "eliminar_api" {
  source     = "../modules/api_gateway"
  name       = "nexa-eliminar-api"
  lambda_arn = module.eliminar_lambda.lambda_arn
  route_key  = "DELETE /estudiantes/{id}" 
}

# ----------------------------------------------------
# 6. OUTPUTS
# ----------------------------------------------------
output "listar_api_url" {
  description = "Endpoint para listar estudiantes"
  value       = module.listar_api.api_endpoint
}

output "añadir_api_url" {
  description = "Endpoint para añadir estudiantes"
  value       = module.añadir_api.api_endpoint
}

output "eliminar_api_url" {
  description = "Endpoint para eliminar estudiantes"
  value       = module.eliminar_api.api_endpoint
}