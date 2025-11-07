variable "vpc_id" {
  description = "ID de la VPC donde está el RDS y la Lambda"
  type        = string
}

variable "rds_sg_id" {
  description = "ID del Security Group del RDS"
  type        = string
}
