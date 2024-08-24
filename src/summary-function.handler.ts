import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelResponse } from '@aws-sdk/client-bedrock-runtime';
import { APIGatewayProxyEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || ''
const PRIMARY_KEY = process.env.PRIMARY_KEY || ''
const SORT_KEY = process.env.SORT_KEY || ''
const RESULT_TABLE_NAME = process.env.RESULT_TABLE_NAME || ''
const SEARCHWORD = process.env.SEARCHWORD || ''
const dynamodbclient = new DynamoDBClient({ region: 'ap-northeast-1' })
const docClient = DynamoDBDocumentClient.from(dynamodbclient);
// Add Bedrock Agent
const bedrockClient = new BedrockRuntimeClient();
let text ="";

export const handler = async (event:any) => {
  try {
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
        });
      }
      
      if(result.LastEvaluatedKey){
        exclusiveStartKey = result.LastEvaluatedKey;
      }else{
        break;
      }
    }
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: `OriginalText: ${text}`,
    }
  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    }
  }
}