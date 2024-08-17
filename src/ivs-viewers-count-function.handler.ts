import {
  IvsClient,
  ListChannelsCommand,
  ListStreamsCommand,
  PutMetadataCommand
} from '@aws-sdk/client-ivs'
import {
  DynamoDB,
  BatchWriteItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb'

let response: object;
const dynamodb = new DynamoDB({});
const ivs = new IvsClient({});

export const handler = async () => {
  const tableName = process.env.TABLE_NAME as string;
  const time = Date.now();
  const counts: { [key: string]: number } = {};

  try {
    // ①チャンネルを取得し、視聴者数を 0 で初期化
    const listChannels = new ListChannelsCommand({});
    const resListChannels = await ivs.send(listChannels);
    if (resListChannels.channels) {
      resListChannels.channels.forEach(channel => {
        if (channel.arn) {
          counts[channel.arn] = 0;
        }
      });
    };

    // ②実際に開始されたストリーミングを取得し、視聴者数を取得
    const listStreams = new ListStreamsCommand({});
    const resListStreams = await ivs.send(listStreams);
    if (resListStreams.streams) {
      resListStreams.streams.forEach((stream) => {
        if (stream.channelArn && stream.viewerCount) {
          counts[stream.channelArn] += stream.viewerCount
        };
      });
    };

    // ③ DynamoDB に書き込みするデータを整形
    const requestItems = Object.entries(counts).map((item) => ({
      PutRequest: {
        Item: {
          channel: { S: item[0] },
          time: { N: String(time) },
          count: { N: String(item[1]) },
        },
      },
    }));

    // ④ DynamoDB に書き込み
    const batchWriteItem = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: requestItems,
      },
    });
    await dynamodb.send(batchWriteItem);

    // ⑤ DynamoDB から直近5分間の視聴者数を取得
    const queries = requestItems.map(item => {
      return new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "channel = :channel",
        ExpressionAttributeValues: {
          ':channel': { S: item.PutRequest.Item.channel.S },
        },
        Limit: 5,
        ScanIndexForward: false
      });
    });

    const results = await Promise.all(
      queries.map(async (query) => {
        return await dynamodb.send(query);
      })
    );

    // ⑥視聴者数を Timed Metadata として IVS に送信
    results.forEach(result => {
      if (result.Items) {
        const input = {
          channelArn: result.Items[0].channel.S,
          metadata: result.Items.map(item => item.count.N).join(',')
        };

        const putMetadataCommand = new PutMetadataCommand(input);

        ivs.send(putMetadataCommand);
      }
    });

    response = {
      statusCode: 200,
      body: JSON.stringify(counts),
    };
  } catch(err) {
    console.log(err);
    return err;
  };

  return response;
};
