import { Duration, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, BillingMode, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class Jpk2024BroadcastBackendIvsViewersCountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ①視聴者数保存用の DynamoDB テーブルを作成
    const ivsViewersCountTable = new Table(this, "ivsViewersCountTable", {
      tableName: "ivs-viewers-count-table",
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'channel', type: AttributeType.STRING },
      sortKey: { name: 'time', type: AttributeType.NUMBER },
      removalPolicy: RemovalPolicy.DESTROY
    });

    // ②Lambda 関数を作成
    const ivsViewersCountFunction = new NodejsFunction(this, "ivsViewersCountFunction", {
      functionName: "ivs-viewers-count-function",
      entry: "src/ivs-viewers-count-function.handler.ts",
      environment: {
          TABLE_NAME: ivsViewersCountTable.tableName
      }
    });

    // ③Lambda 関数に、　DynamoDB の R/W 権限を付与
    ivsViewersCountTable.grantReadWriteData(ivsViewersCountFunction);
    
    // ④Lambda 関数に、 IVS へのアクセス権限を付与
    ivsViewersCountFunction.addToRolePolicy(new PolicyStatement({
      resources: [
        'arn:aws:ivs:ap-northeast-1:*:channel/*'
      ],
      actions: [
        'ivs:ListChannels',
        'ivs:ListStreams',
        'ivs:PutMetadata'
      ]
    }));

    // ⑤Lambda 関数の定期呼び出し用の EventBridge ルールを定義
    new Rule(this, "ivsViewersCountRule", {
      ruleName: "ivs-viewers-count-rule",
      schedule: Schedule.rate(Duration.minutes(1)),
      targets: [
        new LambdaFunction(ivsViewersCountFunction)
      ],
      enabled: false
    });
  }
}
