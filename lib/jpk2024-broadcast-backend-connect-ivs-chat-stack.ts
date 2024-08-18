import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaRestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export class Jpk2024BroadcastBackendConnectIvsChatStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // IVS Chat ルームのリスト一覧を取得するための Lambda 関数を作成
    const listChatRoomFunction = new NodejsFunction(
      this,
      "listChatRoomFunction",
      {
        functionName: "listChatRoomFunction",
        entry: "src/lambda/list-chat-room.js",
      },
    );

    listChatRoomFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ivschat:ListRoom", "ivschat:GetRoom"],
        resources: ["*"],
      }),
    );

    // チャットルームのトークンを生成するための Lambda 関数を作成
    // TODO:疎通成功したらivs-chat-roomlist.tsを読み込むように変更する

    const createChatTokenFunction = new NodejsFunction(
      this,
      "createChatTokenFunction",
      {
        functionName: "createChatTokenFunction",
        entry: "src/lambda/create-chat-token.js",
        environment: {
          name: "amazon-ivs-jaws-pankration-chat-channel",
          arn: "arn:aws:ivschat:ap-northeast-1:590183817826:room/Ip9QgLDctGBK",
        },
      },
    );

    createChatTokenFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ivschat:CreateChatToken"],
        resources: ["*"],
      }),
    );

    // IVS Chatを送信するための Lambda 関数を作成
    // TODO:疎通成功したらivs-chat-roomlist.tsを読み込むように変更する
    const sendChatMessage = new NodejsFunction(
      this,
      "sendChatMessageFunction",
      {
        functionName: "sendChatMessageFunction",
        entry: "src/lambda/send-chat-message.js",
        environment: {
          name: "amazon-ivs-jaws-pankration-chat-channel",
          arn: "arn:aws:ivschat:ap-northeast-1:590183817826:room/Ip9QgLDctGBK",
        },
      },
    );

    createChatTokenFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ivs:GetChannel"],
        resources: ["*"],
      }),
    );

    // Lambda 関数にクライアントがアクセスするための API Gateway を作成

    const ivsChatApi = new LambdaRestApi(this, "createChatTokenIntegration", {
      handler: createChatTokenFunction,
      restApiName: "create-chat-token-apigateway",
      proxy: false,
    });

    const createChat = ivsChatApi.root.addResource("checkChatlist");
    const ivsChatIntegration = new LambdaIntegration(createChatTokenFunction);
    createChat.addMethod("POST", ivsChatIntegration);

    const sendChat = ivsChatApi.root.addResource("sendChat");
    const sendChatIntegration = new LambdaIntegration(sendChatMessage);
    sendChat.addMethod("POST", sendChatIntegration);
  }
}
