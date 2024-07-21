import { Stack, StackProps, Duration } from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RestApi, Model, JsonSchemaType, Cors } from 'aws-cdk-lib/aws-apigateway'
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'


export class Jpk2024BroadcastBackendTranslateFunctionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const translateFunction = new NodejsFunction(this, 'translate-function', {
      runtime: Runtime.NODEJS_18_X,
      functionName: 'translateFunction',
      entry: 'src/translate-function.handler.ts',
      timeout: Duration.seconds(60),
      logRetention: 30,
    })

    translateFunction.addToRolePolicy(
      new PolicyStatement({
        resources: ['*'],
        actions: ['translate:TranslateText'],
      })
    )

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
          translateTo: {
            type: JsonSchemaType.STRING,
          },
        },
        required: ['text', 'translateFrom', 'translateTo'],
      },
    })

    restApiTranslateResource.addMethod('POST', new LambdaIntegration(translateFunction), {
      requestModels: { 'application/json': translateModel },
    })
  }
}
