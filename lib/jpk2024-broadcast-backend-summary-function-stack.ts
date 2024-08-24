import { Stack, StackProps, Duration, Fn } from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { ITableV2, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'


export class Jpk2024BroadcastBackendSummaryFunctionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const summaryResultTableArn = Fn.importValue('summaryResultTableArn');
    const summaryResultTable: ITableV2 = TableV2.fromTableArn(this, 'summaryResultTable', summaryResultTableArn);

    const summaryFunction = new NodejsFunction(this, 'summary-function', {
      runtime: Runtime.NODEJS_18_X,
      functionName: 'summaryFunction',
      entry: 'src/summary-function.handler.ts',
      timeout: Duration.seconds(60),
      logRetention: 30,
      environment: {
        RESULT_TABLE_NAME: 'translateResults',
        RESULT_TABLE_PRIMARY_KEY: 'sessionId',
        RESULT_TABLE_SORT_KEY: 'date',
        SUMMARY_TABLE_NAME: summaryResultTable.tableName,
        SUMMARY_TABLE_PRIMARY_KEY: 'sessionId',
        SESSIONID: ''
      },
    })

    summaryResultTable.grantReadWriteData(summaryFunction);
  }
}
