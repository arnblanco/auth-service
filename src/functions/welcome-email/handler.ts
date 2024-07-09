import { DynamoDBStreamEvent, AttributeValue } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sendWelcomeEmail = async (event: DynamoDBStreamEvent) => {
  try {
    const record = event.Records[0];
    if (record.eventName !== 'INSERT') {
      console.log('Ignoring non-INSERT event');
      return;
    }

    const newImage = record.dynamodb?.NewImage as Record<string, AttributeValue>;
    if (!newImage) {
      console.error('No NewImage found in DynamoDB record');
      return;
    }

    const email = newImage.username.S; 
    
    const sesClient = new SESClient({ region: process.env.AWS_REGION });

    console.log(process.env.EMAIL_SENDER)
    const sendEmailParams = {
      Source: process.env.EMAIL_SENDER,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Bienvenido a nuestro servicio',
        },
        Body: {
          Text: {
            Data: `Hola,\n\nBienvenido a nuestro servicio.`,
          },
        },
      },
    };
    
    await sesClient.send(new SendEmailCommand(sendEmailParams));

    console.log(`Correo de bienvenida enviado a ${email}`);
  } catch (error) {
    console.error('Error al enviar correo de bienvenida:', error);
  }
};

export const main = sendWelcomeEmail;
