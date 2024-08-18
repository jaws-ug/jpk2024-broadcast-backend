import {
  IvschatClient,
  SendEventCommand,
  SendEventRequest,
} from "@aws-sdk/client-ivschat";

/**
 * A function that sends an event to a specified IVS chat room.
 */
interface IVSChatResponse {
  statusCode: number;
  body: string;
}

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    throw new Error(
      `chatEventHandler only accepts POST method, you tried: ${event.httpMethod}`,
    );
  }

  console.info("chatEventHandler received:", event);

  // Parse the incoming request body
  const body = JSON.parse(event.body);
  const { arn, eventAttributes, eventName } = body;

  // Construct parameters.
  // Documentation is available at https://docs.aws.amazon.com/ivs/latest/ChatAPIReference/Welcome.html
  const params: SendEventRequest = {
    roomIdentifier: `${arn}`,
    eventName,
    attributes: { ...eventAttributes },
  };

  try {
    const client = new IvschatClient();
    const command = new SendEventCommand(params);
    const data = await client.send(command);
    console.info("chatEventHandler > IVSChat.sendEvent > Success");
    const response: IVSChatResponse = {
      statusCode: 200,
      body: JSON.stringify(data),
    };
    return response;
  } catch (err) {
    console.error("ERROR: chatEventHandler > IVSChat.sendEvent:", err);
    const response: IVSChatResponse = {
      statusCode: 500,
      body: (err as Error).stack ?? "",
    };
    return response;
  }
};
