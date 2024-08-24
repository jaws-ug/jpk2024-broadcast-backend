import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelResponse } from '@aws-sdk/client-bedrock-runtime';
import { APIGatewayProxyEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommandInput, PutCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

const RESULT_TABLE_NAME = process.env.RESULT_TABLE_NAME || ''
const SEARCHWORD = process.env.SEARCHWORD || ''
const SUMMARY_TABLE_NAME = process.env.SUMMARY_TABLE_NAME || ''
const dynamodbclient = new DynamoDBClient({ region: 'ap-northeast-1' })
const docClient = DynamoDBDocumentClient.from(dynamodbclient);
// Add Bedrock Agent
const bedrockClient = new BedrockRuntimeClient();
let text ="";
const langcode: {code: string, language: string}[] = [
  { code: 'en', language: 'English' }, // English
  { code: 'zh-TW', language: 'Chinese (Traditional)' }, // Chinese (Traditional)
  { code: 'zh', language: 'Chinese (Simplified)' }, // Chinese (Simplified)
  { code: 'hi', language: 'Hindi' }, // Hindi
  { code: 'es', language: 'Spanish' }, // Spanish
  { code: 'es-MX', language: 'Spanish (Mexico)' }, // Spanish (Mexico)
  { code: 'fr', language: 'French' }, // French
  { code: 'fr-CA', language: 'French (Canada)' }, // French (Canada)
  { code: 'id', language: 'Indonesian' }, // Indonesian
  { code: 'pt-PT', language: 'Portuguese (Portugal)' }, // Portuguese (Portugal)
  { code: 'pt', language: 'Portuguese (Brazil)' }, // Portuguese (Brazil)
  { code: 'ru', language: 'Russian' }, // Russian
  { code: 'ur', language: 'Urdu' }, // Urdu
  { code: 'tl', language: 'Filipino' }, // Filipino, Tagalog
  { code: 'ja', language: 'Japanese' }, // Japanese
  { code: 'de', language: 'German' }, // German
  { code: 'ha', language: 'Hausa' }, // Hausa
  { code: 'bn', language: 'Bengali' }, // Bengali
  { code: 'vi', language: 'Vietnamese' }, // Vietnamese
  { code: 'cy', language: 'Welsh' }, // Welsh
  { code: 'ko', language: 'Korean' }, // Korean
  { code: 'it', language: 'Italian' }, // Italian
  { code: 'am', language: 'Amharic' }, // Amharic
  { code: 'ar', language: 'Arabic' }, // Arabic
  { code: 'th', language: 'Thai' }, // Thai
]
let language = ''
let data
let summarytext = ''

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body){
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  try {
    console.log(event.body.replace(/\n|\r\n|\r/g, ''))
    console.log(JSON.parse(event.body.replace(/\n|\r\n|\r/g, '')))
    const requestBody:{
      sessionId: string
    } = JSON.parse(event.body.replace(/\n|\r\n|\r/g, '') || '{"sessionID": ""}' )
    let SEARCHWORD = requestBody.sessionId
    console.log(`SEARCHWORD: ${SEARCHWORD}`)
    
    let queryParam:QueryCommandInput = {
      TableName: RESULT_TABLE_NAME,
      ExpressionAttributeValues: {
        ":sessionId": SEARCHWORD,
      },
      KeyConditionExpression: "sessionId = :sessionId"
    }
    let exclusiveStartKey = null;
    while(true){
      if(exclusiveStartKey){
        queryParam.ExclusiveStartKey = exclusiveStartKey;
      }
      const query = new QueryCommand(queryParam)
      const result = await docClient.send(query)

      if (result.Items) {
        result.Items.forEach(function (item) {
          text += `${item.OriginalText}`
          language = langcode.find((lang) => lang.code === item.SourceLanguageCode)?.language || 'Japanese'
        });
      }
      console.log(`text: ${text}`)
      if(result.LastEvaluatedKey){
        exclusiveStartKey = result.LastEvaluatedKey;
      }else{
        break;
      }
    }
    let promptText = `provide a summary of the following ${language} transcribes within 300 words in English. Try to shorten output for easy reading.;
      <text>${text}</text>;
      `;
    
    let bedrock_body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4800,
      system: 'answer in English',
      messages: [
        {
          role: 'user',
          content: [{
            type: "text",
            text: promptText,
          }],
        },
      ],
    }
    let modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    let bedrock_params = {
      accept: 'application/json',
      contentType: "application/json",
      body: JSON.stringify(bedrock_body),
      modelId,
    }
    let command = new InvokeModelCommand(bedrock_params)
    console.log("SendClient")
    data = await bedrockClient.send(command)
    const decodedResponseBody = new TextDecoder().decode(data.body);
    const bedrock_responseBody = JSON.parse(decodedResponseBody);
    summarytext = bedrock_responseBody.content[0].text;
    console.log(`Summary Text: ${bedrock_responseBody.content[0].text}`)
    let putitem = {
      'sessionId': SEARCHWORD,
      'summaryText':  summarytext,
      'SourceLanguageCode': language,
      'date': parseInt((Date.now() / 1000).toString()).toString(),
    }
    const put_input:PutCommandInput = {
      TableName: SUMMARY_TABLE_NAME,
      Item: putitem,
    }
    const updateitem = new PutCommand(put_input)
    let update_responce = await docClient.send(updateitem)
    console.log(update_responce)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: `SummaryText: ${summarytext} \n Language: ${language}`,
    }
  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    }
  }
}