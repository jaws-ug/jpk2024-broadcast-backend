import { Translate } from 'aws-sdk'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { Logging } from 'aws-cdk-lib/custom-resources';

const translate = new Translate()

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
      'ar' //Arabic
    ]
    /// delete Source Language code from array
    //delete TargetLanguageCodes[TargetLanguageCodes.findIndex(item => item === SourceLanguageCode)]

    let responceBody:any = {
      "originalText": requestBody.text,
      "SourceLanguageCode": requestBody.translateFrom,
    };
    for (const item of TargetLanguageCodes){
      let TargetLanguageCode = item
      let translateParams = {
        Text,
        SourceLanguageCode,
        TargetLanguageCode,
      }
      // translatedText
      const translatedText = await translate.translateText(translateParams).promise()
      /**if (SourceLanguageCode !== TargetLanguageCode){
        const translatedText = await translate.translateText(translateParams)
      }else{
        console.log("Skip Translation")
      }
      */
      // Add Translate results to Array
      console.log(JSON.stringify({ translatedText }))
      responceBody[TargetLanguageCode] = translatedText
      console.log("translatedText:" + responceBody.TargetLanguageCode)
    }
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify({ responceBody }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    }
  }
}
