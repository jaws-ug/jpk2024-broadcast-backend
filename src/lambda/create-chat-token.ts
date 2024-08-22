import {
  IvschatClient,
  CreateChatTokenCommand,
  CreateChatTokenRequest,
} from "@aws-sdk/client-ivschat";

export const handler = async (event: any) => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: `invalid request, you are missing the parameter body`,
    };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: `chatEventHandler only accepts POST method, you tried: ${event.httpMethod}`,
    };
  }

  console.info("chatAuthHandler received:", event);

  // Parse the incoming request body
  const body = JSON.parse(event.body);
  const { arn, roomIdentifier, userId } = body;
  const roomId = arn || roomIdentifier;
  const additionalAttributes = body.attributes || {};
  const capabilities = body.capabilities || []; // The permission to view messages is implicit
  const durationInMinutes = 180;

  if (!roomId || !userId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: "Missing parameters: `arn or roomIdentifier`, `userId`",
    };
  }

  // Construct parameters.
  // Documentation is available at https://docs.aws.amazon.com/ivs/latest/ChatAPIReference/Welcome.html
  const params: CreateChatTokenRequest = {
    roomIdentifier: `${roomId}`,
    userId: `${userId}`,
    attributes: { ...additionalAttributes },
    capabilities: capabilities,
    sessionDurationInMinutes: durationInMinutes,
  };

  try {
    const client = new IvschatClient();
    const command = new CreateChatTokenCommand(params);
    const data = await client.send(command);
    console.info("Got data:", data);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("ERROR: chatAuthHandler > IVSChat.createChatToken:", err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: err,
    };
  }
};
