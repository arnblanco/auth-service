// serverless.ts

import type { AWS } from '@serverless/typescript';
import * as dotenv from 'dotenv'

import register from '@functions/register';
import login from '@functions/login';
import sendWelcomeEmail from '@functions/welcome-email';
import verifyToken from '@functions/verify-token';

dotenv.config();

const serverlessConfiguration: AWS = {
  service: 'auth-service',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    apiGateway: {
      minimumCompressionSize: 512,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_ENV: process.env.NODE_ENV || 'dev',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      JWT_SECRET: process.env.JWT_SECRET,
      USERS_TABLE: process.env.USERS_TABLE,
      EMAIL_SENDER: process.env.EMAIL_SENDER,
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:DescribeTable',
              'dynamodb:DescribeStream',
              'dynamodb:GetRecords',
              'dynamodb:GetShardIterator',
              'dynamodb:ListStreams',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
            ],
            Resource: [
              `arn:aws:dynamodb:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:table/${process.env.USERS_TABLE}`,
              {
                'Fn::Sub': `arn:aws:dynamodb:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:table/${process.env.USERS_TABLE}/stream/*`
              },
            ],
          },
          {
            Effect: 'Allow',
            Action: 'ses:SendEmail',
            Resource: `arn:aws:ses:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:identity/${process.env.EMAIL_SENDER}`
          }
        ],
      },
    },
  },
  functions: {
    register,
    login,
    sendWelcomeEmail,
    verifyToken
  },
  resources: {
    Resources: {
      UsersTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: process.env.USERS_TABLE,
          AttributeDefinitions: [
            { AttributeName: 'username', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'username', KeyType: 'HASH' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          StreamSpecification: {
            StreamViewType: 'NEW_IMAGE',
          },
          GlobalSecondaryIndexes: [
            {
              IndexName: 'UsernameIndex',
              KeySchema: [
                { AttributeName: 'username', KeyType: 'HASH' },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
            },
          ],
        },
      },
      DynamoDbTableEventPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { 'Fn::GetAtt': ['SendWelcomeEmailLambdaFunction', 'Arn'] },
          Action: 'lambda:InvokeFunction',
          Principal: 'dynamodb.amazonaws.com',
          SourceArn: { 'Fn::GetAtt': ['UsersTable', 'StreamArn'] },
        },
      },
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node20',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
