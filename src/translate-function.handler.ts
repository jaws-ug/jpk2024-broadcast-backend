import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'
import { IvschatClient, SendEventCommand, SendEventCommandInput } from '@aws-sdk/client-ivschat'
import { APIGatewayProxyEvent } from 'aws-lambda'

const translateClient = new TranslateClient()
const ivschatClient = new IvschatClient()

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
    const TargetLanguages: {code: string, ivschatArn: string}[] = [
      { code: 'en', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/j0Bpz9gSqfZQ' }, // English
      { code: 'zh-TW', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/6TWyXlBIc3Mi' }, // Chinese (Traditional)
      { code: 'zh', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/npVBfMQnFWa6' }, // Chinese (Simplified)
      { code: 'hi', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/UVkCvy7P2lv0' }, // Hindi
      { code: 'es', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/us1pM7NpiBv7' }, // Spanish
      { code: 'es-MX', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/eUXzkX0YlYfx' }, // Spanish (Mexico)
      { code: 'fr', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/h8ChUOmsgRNf' }, // French
      { code: 'fr-CA', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/SWapWeFLUt8w' }, // French (Canada)
      { code: 'id', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/68XcovzKksVs' }, // Indonesian
      { code: 'pt-PT', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/czLj6Cr2d5X2' }, // Portuguese (Portugal)
      { code: 'pt', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/ctZMuTI64pzx' }, // Portuguese (Brazil)
      { code: 'ru', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/EOf7ath5OmEJ' }, // Russian
      { code: 'ur', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/ngA7TCp0zBAR' }, // Urdu
      { code: 'tl', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/PelwB5i280jq' }, // Filipino, Tagalog
      { code: 'ja', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/RfWlo5LhpnZM' }, // Japanese
      { code: 'de', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/sefNlZuuXxYv' }, // German
      { code: 'ha', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/alvrQ0ZuVuLw' }, // Hausa
      { code: 'bn', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/9Ou5OVd0XUQ5' }, // Bengali
      { code: 'vi', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/pp2sSQM7EzmL' }, // Vietnamese
      { code: 'cy', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/vg1Wesd1NST9' }, // Welsh
      { code: 'ko', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/O5us3FwQlS7B' }, // Korean
      { code: 'it', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/em8tQ9W96uHF' }, // Italian
      { code: 'am', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/yyfq9CGYEWpe' }, // Amharic
      { code: 'ar', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/yui9NNk6Ftev' }, // Arabic
      { code: 'th', ivschatArn: 'arn:aws:ivschat:ap-northeast-1:590183817826:room/Sbu7afLJ6vjW' }, // Thai
    ]
    let promises = []
    for (const item of TargetLanguages){
      let TargetLanguageCode = item.code
      let translateParams = {
        Text: Text,
        SourceLanguageCode: SourceLanguageCode,
        TargetLanguageCode: TargetLanguageCode,
      }
      promises.push(translatetext(translateParams, item.ivschatArn))
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
const translatetext = async (translateParams: TranslateParams, ivschatArn: string): Promise<ResponseBody> => {
  console.log('Translate Started: `${translateParams.SourceLanguageCode} -> ${translateParams.TargetLanguageCode}`');
  try {
    const request = new TranslateTextCommand(translateParams)
    const data = await translateClient.send(request);
    if (data.TranslatedText === undefined) {
      data.TranslatedText = 'Translate error';
    }
    console.log(translateParams.TargetLanguageCode)
    console.log(data.TranslatedText)
    console.log(typeof(data.TranslatedText))  
    console.log(`Translate ended: ${translateParams.SourceLanguageCode} -> ${translateParams.TargetLanguageCode}`)

    const ivschatParams: SendEventCommandInput  = {
      roomIdentifier: ivschatArn,
      eventName: `${translateParams.TargetLanguageCode}-translation`,
      attributes: {
        text: data.TranslatedText,
      },
    }

    const ivschatSendEventCommand = new SendEventCommand(ivschatParams)
    await ivschatClient.send(ivschatSendEventCommand)
    console.log('SendEventCommand sent')

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
