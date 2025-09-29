import * as lambda from "aws-lambda";
import { validateMintGetterEnvironment } from "../config/environment";
import { GetterService } from "../services/GetterService";
import { createResponse } from "../utils/responses";

const getterService = new GetterService(validateMintGetterEnvironment());

export const handler: lambda.APIGatewayProxyHandler = async (
  event: lambda.APIGatewayProxyEvent
) => {
  try {
    const queryParams = event.queryStringParameters;

    if (!queryParams) {
      return createResponse(400, {
        error: "Query parameters are required",
      });
    }

    // Extract and validate limit parameter
    const limitParam = queryParams.limit;
    const limit = limitParam ? parseInt(limitParam, 10) : 10; // Default to 10

    if (isNaN(limit) || limit < 1 || limit > 10) {
      return createResponse(400, {
        error: "limit should be a number between 1 and 10",
      });
    }

    const nextToken = queryParams.nextToken;

    const response = await getterService.getMints(limit, nextToken);

    return createResponse(200, response);
  } catch (error) {
    console.error("Error getting Mints:", error);

    return createResponse(500, {
      error: "Failed to get mints request",
      message: "Please contact support.",
    });
  }
};
