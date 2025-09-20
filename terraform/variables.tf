variable "lambda_s3_key" {
  description = "S3 key for Lambda code"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}