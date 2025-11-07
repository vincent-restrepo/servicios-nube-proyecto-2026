# infra/serverless/providers.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
  
  backend "s3" {
    bucket         = "nexa-cloud-tf-state-111811373821"
    key            = "serverless.tfstate"            # Clave ÚNICA para su estado
    region         = "us-east-1"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

# LECTURA DEL ESTADO DE LA RED
data "terraform_remote_state" "red_base" {
  backend = "s3"
  config = {
    bucket         = "nexa-cloud-tf-state-111811373821"
    key            = "network-base.tfstate" 
    region         = "us-east-1"
  }
}

# LECTURA DEL ESTADO DE LA BASE DE DATOS
data "terraform_remote_state" "db_base" {
  backend = "s3"
  config = {
    bucket         = "nexa-cloud-tf-state-111811373821"
    key            = "database.tfstate" # Lee el estado del compañero DB
    region         = "us-east-1"
  }
}