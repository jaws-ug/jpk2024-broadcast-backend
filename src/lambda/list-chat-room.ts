/**
 * A function that lists all IVSChat rooms in the current account and region.
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

exports.chatListHandler = async (event: any): Promise<IVSChatResponse> => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `chatListHandler only accepts GET method, you tried: ${event.httpMethod}`,
    );
  }

  console.info("chatListHandler received:", event);

  try {
    const data = await IVSChat.listRooms().promise();
    console.info("chatListHandler > IVSChat.listRooms > Success");
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
    console.error("ERROR: chatListHandler > IVSChat.listRooms:", err);
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
