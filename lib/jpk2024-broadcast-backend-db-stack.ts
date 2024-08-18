import { Stack, StackProps, CfnOutput ,RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb'


export class Jpk2024BroadcastBackendDbStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const translateResultTable = new TableV2(this, 'translateResultTable', {
      /**
       * 2024/8/17 Change date type to String.
       */
      partitionKey: {
        name: 'date',
        type: AttributeType.NUMBER
      },
      sortKey: {
        name: 'sessionId',
        type: AttributeType.STRING
      },
      tableName: 'translateResult',
      removalPolicy: RemovalPolicy.RETAIN
    })

    new CfnOutput(this, 'translateResultTableArn', {
      description: 'The ARN of translateResultTableArn',
      exportName: 'translateResultTableArn',
      value: translateResultTable.tableArn,
    })

    const summaryResultTable = new TableV2(this, 'summaryResultTable', {
      partitionKey: {
        name: 'sessionId',
        type: AttributeType.STRING
      },
      tableName: 'summaryResult',
      removalPolicy: RemovalPolicy.RETAIN
    })

    new CfnOutput(this, 'summaryResultTableArn', {
      description: 'The ARN of summaryResultTableArn',
      exportName: 'summaryResultTableArn',
      value: summaryResultTable.tableArn,
    })
  }
}