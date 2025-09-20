output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.cpf_auth.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.cpf_auth.arn
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "ID of the Cognito Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "lambda_s3_bucket_name" {
  description = "Name of the S3 bucket for Lambda code"
  value       = aws_s3_bucket.lambda_code.bucket
}