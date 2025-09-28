import { IMintRequest } from "@alongside/shared-types";
import * as lambda from "aws-lambda";
import { env } from "../config/environment";
import { CreatorService } from "../services/CreatorService";
import { createResponse } from "../utils/responses";

const mintService = new CreatorService(env);

export const handler: lambda.APIGatewayProxyHandler = async (
  event: lambda.APIGatewayProxyEvent
) => {
  try {
    const mintRequest = JSON.parse(event.body || "{}") as IMintRequest;

    if (!mintRequest) {
      throw new Error("body is not defined");
    }

    const { amount, token } = mintRequest;

    if (!amount || !token) {
      return createResponse(400, {
        error: "Missing required fields: amount, token",
      });
    }

    if (typeof amount !== "number" || amount < 1) {
      return createResponse(400, {
        error: "Amount should be greater or equal than 1",
      });
    }

    if (token !== "doge") {
      return createResponse(400, {
        error: "The supported token is doge",
      });
    }

    const mint = await mintService.createMint({ amount, token });

    return createResponse(200, {
      id: mint.mintId,
      status: mint,
      message: "Mint request received and queued for processing",
    });
  } catch (error) {
    console.error("Error processing Mint:", error);

    return createResponse(500, {
      error: "Failed to process mint request",
      message: "Please contact support.",
    });
  }
};
