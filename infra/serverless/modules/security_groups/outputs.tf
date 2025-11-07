output "lambda_sg_id" {
  description = "ID del SG creado para Lambda"
  value       = aws_security_group.lambda_sg.id
}
