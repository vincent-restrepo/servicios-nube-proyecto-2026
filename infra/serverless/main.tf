# infra/serverless/main.tf

# ----------------------------------------------------
# 1. IAM ROLE (Recupera el rol que Lambda debe usar)
# ----------------------------------------------------
data "aws_iam_role" "labrole" {
  name = "labrole"
}

# ----------------------------------------------------
# 2. DEFINICIÓN DE RUTAS LOCALES (Los ZIPs se crean externamente)
# ----------------------------------------------------
locals {
  # Definimos las rutas relativas a los archivos ZIP.
  # NOTA: Estos ZIPs deben ser creados externamente (con el script 'package_lambdas.sh')
  # antes de ejecutar 'terraform apply'.
  añadir_zip_path   = "../lambda/añadir_estudiante/añadir_estudiante.zip"
  eliminar_zip_path = "../lambda/eliminar_estudiante/eliminar_estudiante.zip"
  listar_zip_path   = "../lambda/listar_estudiantes/listar_estudiantes.zip"
}


# ----------------------------------------------------
# 3. SECURITY GROUPS (Crea el SG para Lambda y regla al RDS)
# ----------------------------------------------------
module "security_groups" {
  source    = "./modules/security_groups"
  # LEE del estado remoto de la red base (nexa-vpc)
  vpc_id    = data.terraform_remote_state.red_base.outputs.vpc_id 
  rds_sg_id = data.terraform_remote_state.red_base.outputs.sg_rds_id 
}

# ----------------------------------------------------
# 4. DESPLIEGUE DE FUNCIONES LAMBDA (3 funciones)
# ----------------------------------------------------

# A. Función para Listar Estudiantes
module "listar_lambda" {
  source = "./modules/lambda_function"

  lambda_name        = "nexa-listar-estudiantes"
  lambda_handler     = "app.lambda_handler"
  lambda_role_arn    = data.aws_iam_role.labrole.arn
  # Pasamos la ruta absoluta
  lambda_zip_file    = abspath(local.listar_zip_path) 
  
  # LEE del estado remoto de la DB (nexa-db)
  rds_endpoint       = data.terraform_remote_state.db_base.outputs.rds_endpoint
  db_user            = "nexa_admin"
  db_password        = data.terraform_remote_state.db_base.outputs.rds_master_password
  db_name            = "nexacloud"

  # LEE del estado remoto de la red base (nexa-vpc)
  subnet_ids         = data.terraform_remote_state.red_base.outputs.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# B. Función para Añadir Estudiantes (PUNTO CRÍTICO REVISADO)
module "añadir_lambda" {
  source = "./modules/lambda_function"

  lambda_name        = "nexa-anadir-estudiantes" 
  lambda_handler     = "app.lambda_handler"
  lambda_role_arn    = data.aws_iam_role.labrole.arn
  # Pasamos la ruta absoluta
  lambda_zip_file    = abspath(local.añadir_zip_path) 
  
  # LEE del estado remoto de la DB (nexa-db)
  rds_endpoint       = data.terraform_remote_state.db_base.outputs.rds_endpoint
  db_user            = "nexa_admin"
  db_password        = data.terraform_remote_state.db_base.outputs.rds_master_password
  db_name            = "nexacloud"

  # LEE del estado remoto de la red base (nexa-vpc)
  subnet_ids         = data.terraform_remote_state.red_base.outputs.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# C. Función para Eliminar Estudiantes
module "eliminar_lambda" {
  source = "./modules/lambda_function"

  lambda_name        = "nexa-eliminar-estudiantes"
  lambda_handler     = "app.lambda_handler"
  lambda_role_arn    = data.aws_iam_role.labrole.arn
  # Pasamos la ruta absoluta
  lambda_zip_file    = abspath(local.eliminar_zip_path) 
  
  # LEE del estado remoto de la DB (nexa-db)
  rds_endpoint       = data.terraform_remote_state.db_base.outputs.rds_endpoint
  db_user            = "nexa_admin"
  db_password        = data.terraform_remote_state.db_base.outputs.rds_master_password
  db_name            = "nexacloud"

  # LEE del estado remoto de la red base (nexa-vpc)
  subnet_ids         = data.terraform_remote_state.red_base.outputs.private_subnet_ids
  security_group_ids = [module.security_groups.lambda_sg_id]
}

# ----------------------------------------------------
# 5. API GATEWAY (Un API Gateway por cada función)
# ----------------------------------------------------

# A. API para Listar Estudiantes (GET)
module "listar_api" {
  source     = "./modules/api_gateway"
  name       = "nexa-listar-api"
  lambda_arn = module.listar_lambda.lambda_arn
  route_key  = "GET /estudiantes"
}

# B. API para Añadir Estudiantes (POST)
module "añadir_api" {
  source     = "./modules/api_gateway"
  name       = "nexa-añadir-api"
  lambda_arn = module.añadir_lambda.lambda_arn
  route_key  = "POST /estudiantes"
}

# C. API para Eliminar Estudiantes (DELETE)
module "eliminar_api" {
  source     = "./modules/api_gateway"
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