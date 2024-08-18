import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'
import { APIGatewayProxyEvent } from 'aws-lambda'

const client = new TranslateClient()

export const handler = async (event: APIGatewayProxyEvent) => {

  if (!event.body){
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  try {
    const requestBody = JSON.parse(event.body || '{"text": "", "translateFrom": ""}') as {
      text: string
      translateFrom: string
    }
    const Text = requestBody.text
    const SourceLanguageCode = requestBody.translateFrom
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    }
  }
}
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
      throw new Error('TranslatedText is undefined');
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