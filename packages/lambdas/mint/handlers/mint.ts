import * as lambda from "aws-lambda";

export const handler: lambda.APIGatewayProxyHandler = async (
  event: lambda.APIGatewayProxyEvent
) => {
  try {
    console.log(event.body, "body");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Dummy 200 message",
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Dummy 500 message",
      }),
    };
  }
};
