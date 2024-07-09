import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import * as bcrypt from 'bcryptjs';
import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import schema from './schema';

const register: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const { name, username, password } = event.body;
  const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

  const hashedPassword = await bcrypt.hash(password, 10);

  const params = {
    TableName: process.env.USERS_TABLE,
    Item: {
      name: { S: name },
      username: { S: username },
      password: { S: hashedPassword },
    },
  };

  const dbResponse = await dbClient.send(new PutItemCommand(params));
  console.log(dbResponse)

  return formatJSONResponse({
    data: {
      type: 'users',
      attributes: {
        name,
        username,
      },
    },
  }, 200);
};

export const main = middyfy(register);
