// src/functions/verify-token/verify-token.ts

import { APIGatewayTokenAuthorizerEvent, AuthResponse, APIGatewayAuthorizerResultContext  } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  username: string;
  name: string;
}

const generatePolicy = (principalId: string, effect: 'Allow' | 'Deny', resource: string): AuthResponse => {
  const authResponse: AuthResponse = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
  return authResponse;
};

const verifyToken = async (event: APIGatewayTokenAuthorizerEvent): Promise<AuthResponse> => {
    const token = event.authorizationToken.replace("Bearer ", "");
    const methodArn = event.methodArn;
  
    if (!token || !methodArn ) {
      throw new Error('Unauthorized');
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      const policyDocument = generatePolicy(decoded.username, 'Allow', methodArn);

      const context: APIGatewayAuthorizerResultContext = {
        username: decoded.username,
        name: decoded.name,
      };
  
      return {
        ...policyDocument,
        context,
      };
    } catch (error) {
      console.error('Invalid token:', error);
      throw new Error('Unauthorized');
    }
};

export const main = verifyToken;
