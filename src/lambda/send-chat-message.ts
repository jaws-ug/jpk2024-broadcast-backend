const IVSChat = new AWS.Ivschat();

/**
 * A function that sends an event to a specified IVS chat room.
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

interface IVSChatParams {
  roomIdentifier: string;
  eventName: string;
  attributes: any;
}

exports.chatEventHandler = async (event: any): Promise<IVSChatResponse> => {
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
  const params: IVSChatParams = {
    roomIdentifier: `${arn}`,
    eventName,
    attributes: { ...eventAttributes },
  };

  try {
    await IVSChat.sendEvent(params).promise();
    console.info("chatEventHandler > IVSChat.sendEvent > Success");
    const response: IVSChatResponse = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify({
        arn: `${arn}`,
        status: "success",
      }),
    };
    return response;
  } catch (err) {
    console.error("ERROR: chatEventHandler > IVSChat.sendEvent:", err);
    const response: IVSChatResponse = {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
      body: (err as Error).stack ?? "",
    };
    return response;
  }
};
