import {
  IvschatClient,
  SendEventCommand,
  SendEventCommandInput,
  SendEventRequest,
} from "@aws-sdk/client-ivschat";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ivsChatRoomList } from "../ivs-chat-roomlist";

const client = new IvschatClient();

const sendMyMessage = async (params: SendEventCommandInput): Promise<void> => {
  try {
    const command = new SendEventCommand(params);
    const data = await client.send(command);
    console.info("chatEventHandler > IVSChat.sendEvent > Success", data);
    return;
  } catch (err) {
    console.error("ERROR: chatEventHandler > IVSChat.sendEvent:", err);
    return;
  }
};

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: `invalid request, you are missing the parameter body`,
    };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      body: `chatEventHandler only accepts POST method, you tried: ${event.httpMethod}`,
    };
  }

  console.info("chatEventHandler received:", event);
  // Parse the incoming request body
  const body = JSON.parse(event.body);

  for (const item of ivsChatRoomList) {
    const ivschatParams: SendEventCommandInput = {
      roomIdentifier: item.arn,
      eventName: `${item.code}-translation`,
      attributes: {
        text: "sample data",
      },
    };

    sendMyMessage(ivschatParams);
  }
  return { statusCode: 200, body: "sendChatMessage finished" };
};
