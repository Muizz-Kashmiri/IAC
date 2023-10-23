provider "aws" {
  region = "us-east-1"
}

variable "aws_region" {
  type    = string
  default = "us-east-1" 
  
}
variable "table_name" {
  type    = string
  default = "TodoListTable"
}


data "aws_caller_identity" "current" {}

resource "aws_dynamodb_table" "TodoListTable" {
  name           = var.table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "itemId"
  read_capacity  = 0
  write_capacity = 0

  attribute {
    name = "itemId"
    type = "S"
  }
}


resource "aws_iam_role" "helloRole" {
  name = "helloRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "helloRolePolicy" {
  name = "helloRolePolicy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:DeleteItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem",
          "dynamodb:DescribeTable",
          "dynamodb:ConditionCheckItem"
        ],
        Effect = "Allow",
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_dynamodb_table.TodoListTable.name}",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_dynamodb_table.TodoListTable.name}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "test-attach" {
  role       = aws_iam_role.helloRole.name
  policy_arn = aws_iam_policy.helloRolePolicy.arn
}


resource "aws_lambda_function" "hello" {
  s3_bucket         = "lamb-api-bucket"
  s3_key            = "Archive.zip"
  function_name     = "hello"
  description       = "Lambda function for invoking API Gateway and DynamoDB"
  handler           = "handler.hello"
  runtime           = "nodejs16.x"
  role              = aws_iam_role.helloRole.arn

  environment {
    variables = {
      TABLE_NAME = var.table_name
    }
  }

  tags = {
    "lambda:createdBy" = "CFN"
  }
}


resource "aws_api_gateway_rest_api" "ServerlessRestApi" {
  name        = "ServerlessRestApi"
  description = "API that triggers lambda function"
  body = jsonencode({
    info = {
      version = "1.0"
       title   = "Terraform API"
    }
    paths = {
      "/hello/{itemId}" = {
        "x-amazon-apigateway-any-method" = {
          "x-amazon-apigateway-integration" = {
            httpMethod = "POST"
            type       = "AWS_PROXY"
            uri        = aws_lambda_function.hello.invoke_arn
          }
          responses = {}
        }
      }
      "/hello" = {
        post = {
          "x-amazon-apigateway-integration" = {
            httpMethod = "POST"
            type       = "AWS_PROXY"
            uri        = aws_lambda_function.hello.invoke_arn
          }
          responses = {}
        }
        get = {
          "x-amazon-apigateway-integration" = {
            httpMethod = "POST"
            type       = "AWS_PROXY"
            uri        = aws_lambda_function.hello.invoke_arn
          }
          responses = {}
        }
      }
    }
    swagger = "2.0"
  })
}


resource "aws_lambda_permission" "helloCreateAPIPostPermissionProd" {
  statement_id  = "AllowAPIGatewayInvokePost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello.arn
  principal     = "apigateway.amazonaws.com"
  source_arn = format(
    "arn:aws:execute-api:%s:%s:%s/Stage/POST/hello",
    var.aws_region, 
    data.aws_caller_identity.current.account_id,
    aws_api_gateway_rest_api.ServerlessRestApi.id
  )
}

resource "aws_lambda_permission" "helloCreateAPIGetPermissionProd" {
  statement_id  = "AllowAPIGatewayInvokeGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello.arn
  principal     = "apigateway.amazonaws.com"
  source_arn = format(
    "arn:aws:execute-api:%s:%s:%s/Stage/GET/hello",
    var.aws_region, 
    data.aws_caller_identity.current.account_id,
    aws_api_gateway_rest_api.ServerlessRestApi.id
  )
}

resource "aws_api_gateway_deployment" "ServerlessRestApiDeployment" {
  rest_api_id = aws_api_gateway_rest_api.ServerlessRestApi.id
  stage_name  = "Stage"
}

resource "aws_lambda_permission" "helloOtherOperationsAPIPermissionProd" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hello.arn
  principal     = "apigateway.amazonaws.com"
  source_arn = format(
    "arn:aws:execute-api:%s:%s:%s/Stage/*/hello/*",
    var.aws_region, 
    data.aws_caller_identity.current.account_id,
    aws_api_gateway_rest_api.ServerlessRestApi.id
  )
}

resource "aws_api_gateway_stage" "ServerlessRestApiProdStage" {
  deployment_id = aws_api_gateway_deployment.ServerlessRestApiDeployment.id
  rest_api_id   = aws_api_gateway_rest_api.ServerlessRestApi.id
  stage_name    = "Prod"
}
