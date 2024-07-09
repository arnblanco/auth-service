import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import schema from './schema';

const login: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const { username, password } = event.body;
  const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

  const params = {
    TableName: process.env.USERS_TABLE,
    Key: {
      username: { S: username },
    },
  };

  try {
    const data = await dbClient.send(new GetItemCommand(params));

    if (!data.Item) {
      return formatJSONResponse({ message: 'Usuario no encontrado' }, 404);
    }

    const user = unmarshall(data.Item);

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return formatJSONResponse({ message: 'Credenciales inválidas' }, 401);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return formatJSONResponse({
      token
    }, 200);
  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    return formatJSONResponse({ message: 'Error interno al autenticar usuario' }, 500);
  }
};

export const main = middyfy(login);
