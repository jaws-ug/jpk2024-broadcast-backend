import { Stack, StackProps, Duration, Fn } from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { ITableV2, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, Model, JsonSchemaType, Cors } from 'aws-cdk-lib/aws-apigateway'
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'


export class Jpk2024BroadcastBackendTranslateFunctionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const translateResultTableArn = Fn.importValue('translateResultTableArn');
    const translateResultTable: ITableV2 = TableV2.fromTableArn(this, 'translateResultTable', translateResultTableArn);

    const translateFunction = new NodejsFunction(this, 'translate-function', {
      runtime: Runtime.NODEJS_18_X,
      functionName: 'translateFunction',
      entry: 'src/translate-function.handler.ts',
      timeout: Duration.seconds(60),
      logRetention: 30,
    })

    translateFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: ['translate:TranslateText'],
      })
    )

    translateFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ivschat:SendEvent"],
        resources: ["*"],
      })
    )
    // add readWrite permission to the translateResultTable
    translateResultTable.grantReadWriteData(translateFunction);

    const restApi = new RestApi(this, 'translate-function-rest-api', {
      restApiName: 'RestApiForTranslateFunction',
      deployOptions: {
        stageName: 'v1',
      },
    })

    const restApiTranslateResource = restApi.root.addResource('translate', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        statusCode: 200,
      },
    })

    const translateModel: Model = restApi.addModel('translateModel', {
      schema: {
        type: JsonSchemaType.OBJECT,
        properties: {
          text: {
            type: JsonSchemaType.STRING,
          },
          translateFrom: {
            type: JsonSchemaType.STRING,
          },
        },
        required: ['text', 'translateFrom'],
      },
    })

    restApiTranslateResource.addMethod('POST', new LambdaIntegration(translateFunction), {
      requestModels: { 'application/json': translateModel },
    })
  }
}
