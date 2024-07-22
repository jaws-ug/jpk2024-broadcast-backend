import { Translate } from 'aws-sdk'
import { APIGatewayProxyEvent } from 'aws-lambda'

const translate = new Translate()

export const handler = async (event: APIGatewayProxyEvent) => {

  if (!event.body){
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  try {
    const requestBody = JSON.parse(event.body || '{"text": "", "translateFrom": "", "translateTo": ""}') as {
      text: string
      translateFrom: string
      translateTo: string
    }
    const Text = requestBody.text
    const SourceLanguageCode = requestBody.translateFrom
    const TargetLanguageCode = requestBody.translateTo

    const translateParams = {
      Text,
      SourceLanguageCode,
      TargetLanguageCode,
    }

    const translatedText = await translate.translateText(translateParams).promise()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify({ translatedText }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    }
  }
}
