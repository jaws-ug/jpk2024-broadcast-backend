import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

const client = new TranslateClient()
const TABLE_NAME = process.env.TABLE_NAME || ''
const PRIMARY_KEY = process.env.PRIMARY_KEY || ''
const SORT_KEY = process.env.SORT_KEY || ''
const dynamodbclient = new DynamoDBClient({ region: 'ap-northeast-1' })

const docClient = DynamoDBDocumentClient.from(dynamodbclient);

interface TranslateParams {
  TargetLanguageCode: string;
  SourceLanguageCode: string;
  Text: string;
}

interface ResponseBody {
  TargetLanguageCode: string;
  TranslatedText: string;
}
const translatetext = async (translateParams: TranslateParams): Promise<ResponseBody> => {
  console.log('Translate Started: `${translateParams.SourceLanguageCode} -> ${translateParams.TargetLanguageCode}`');
  try {
    const request = new TranslateTextCommand(translateParams)
    const data = await client.send(request);
    if (data.TranslatedText === undefined) {
      data.TranslatedText = 'Translate error';
    }
    console.log(translateParams.TargetLanguageCode)
    console.log(data.TranslatedText)
    console.log(typeof(data.TranslatedText))  
    console.log(`Translate ended: ${translateParams.SourceLanguageCode} -> ${translateParams.TargetLanguageCode}`)
    return {
      TargetLanguageCode: translateParams.TargetLanguageCode,
      TranslatedText: data.TranslatedText,
    };
  } catch (err) {
    return {
      TargetLanguageCode: translateParams.TargetLanguageCode,
      TranslatedText: 'error',
    };
  }
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const dateTime = parseInt((Date.now() / 1000).toString())
  console.log(dateTime)
  console.log('unixtime:', dateTime)
  if (!event.body){
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  try {
    console.log(event.body.replace(/\n|\r\n|\r/g, ''))
    console.log(JSON.parse(event.body.replace(/\n|\r\n|\r/g, '')))
    const requestBody:{
      text: string
      translateFrom: string
      sessionId: string
    } = JSON.parse(event.body.replace(/\n|\r\n|\r/g, '') || '{"text": "", "translateFrom": "", "sessionID": ""}' )
    const Text = requestBody.text
    const SourceLanguageCode = requestBody.translateFrom
    const SessionID = requestBody.sessionId
    const input:PutCommandInput = {
      TableName: TABLE_NAME,
      Item: {
        'date': dateTime.toString(),
        'sessionId': requestBody.sessionId,
        'OriginalText': Text ,
        'SourceLanguageCode': SourceLanguageCode,
      },
    }
    const createitem = new PutCommand(input)
    console.log(dateTime.toString())
    let responce = await docClient.send(createitem)
    console.log(responce)
    /**
     * Supported languages and language codes - Amazon Translate
     * https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html
     */
    const TargetLanguageCodes = [
      'en', //English
      'zh-TW', //Chinese (Traditional)
      'zh', //Chinese (Simplified)
      'hi', //Hindi
      'es', //Spanish
      'es-MX', //Spanish (Mexico)
      'fr', //French
      'fr-CA', //French (Canada)
      'id', //Indonesian
      'pt-PT', //Portuguese (Portugal)
      'pt', //Portuguese (Brazil)
      'ru', //Russian
      'ur', //Urdu
      'tl', //Filipino, Tagalog
      'ja', //Japanese
      'de', //German
      'ha', //Hausa
      'bn', //Bengali
      'vi', //Vietnamese
      'cy', //Welsh
      'ko', //Korean
      'it', //Italian
      'am', //Amharic
      'ar', //Arabic
      'th'  //Thai
    ]
    let promises = []
    for (const item of TargetLanguageCodes){
      let TargetLanguageCode = item
      let translateParams = {
        Text: Text,
        SourceLanguageCode: SourceLanguageCode,
        TargetLanguageCode: TargetLanguageCode,
      }
      promises.push(translatetext(translateParams))
    }
    const results = await Promise.all(promises).then(function(value){
      console.log(value)
    });
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: 'OK',
    }
  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    }
  }
}