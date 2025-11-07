variable "lambda_arn" {}
variable "name" {}
# 💡 Se añade esta variable para permitir rutas dinámicas (Ej: "GET /estudiantes")
variable "route_key" {} 

# 1️⃣ Crear la API HTTP
resource "aws_apigatewayv2_api" "api" {
  name          = var.name
  protocol_type = "HTTP"
}

# 2️⃣ Crear la integración con Lambda
resource "aws_apigatewayv2_integration" "integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_arn
  payload_format_version = "2.0"
}

# 3️⃣ Crear la ruta (Ahora usa la variable 'route_key')
resource "aws_apigatewayv2_route" "route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = var.route_key 
  target    = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

# 4️⃣ Permitir que API Gateway invoque la Lambda
resource "aws_lambda_permission" "apigw_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# 5️⃣ Crear el stage (despliegue automático)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

# 6️⃣ Salida: URL del endpoint
output "api_endpoint" {
  value = aws_apigatewayv2_api.api.api_endpoint
}