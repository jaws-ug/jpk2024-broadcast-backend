import { Ivschat } from "aws-sdk";

/**
 * A function that generates an IVS chat authentication token based on the request parameters.
 */
interface IVSChatResponse {
  statusCode: number;
  headers: {
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
  };
  body: string;
}

exports.chatAuthHandler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    throw new Error(
      `chatAuthHandler only accepts POST method, you tried: ${event.httpMethod}`,
    );
  }

  console.info("chatAuthHandler received:", event);

  // Parse the incoming request body
  const body = JSON.parse(event.body);
  const { arn, roomIdentifier, userId } = body;
  const roomId = arn || roomIdentifier;
  const additionalAttributes = body.attributes || {};
  const capabilities = body.capabilities || []; // The permission to view messages is implicit
  const durationInMinutes = body.durationInMinutes || 55; // default the expiration to 55 mintues

  if (!roomId || !userId) {
    const response: IVSChatResponse = {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify({
        error: "Missing parameters: `arn or roomIdentifier`, `userId`",
      }),
    };
    return response;
  }

  // Construct parameters.
  // Documentation is available at https://docs.aws.amazon.com/ivs/latest/ChatAPIReference/Welcome.html
  const params = {
    roomIdentifier: `${roomId}`,
    userId: `${userId}`,
    attributes: { ...additionalAttributes },
    capabilities: capabilities,
    sessionDurationInMinutes: durationInMinutes,
  };

  try {
    const data = await IVSChat.createChatToken(params).promise();
    console.info("Got data:", data);
    const response: IVSChatResponse = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify(data),
    };

    console.info(
      `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`,
    );
    return response;
  } catch (err) {
    console.error("ERROR: chatAuthHandler > IVSChat.createChatToken:", err);
    const response: IVSChatResponse = {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      body: (err as Error).stack ?? "",
    };

    console.info(
      `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`,
    );
    return response;
  }
};
