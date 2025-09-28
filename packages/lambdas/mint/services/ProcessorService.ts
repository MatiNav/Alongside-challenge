import { IMintDBObject } from "@alongside/shared-types";
import * as dynamodb from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ILambdaEnvironment } from "../config/environment";

const dynamoDbClient = new dynamodb.DynamoDBClient({});

export class ProcessorService {
  constructor(private readonly env: ILambdaEnvironment) {}

  async processMint(mintId: string) {
    try {
      const mintRecord = await this.getMintRecord(mintId);

      if (mintRecord.status === "COMPLETED") {
        console.log(`Mint ${mintId} already completed`);
        return;
      }

      await this.updateMintStatus(mintId, "PROCESSING");

      const result = await this.callExternalService(mintRecord);
      console.log(`External service response:`, result);

      if (result.success) {
        await this.updateMintStatus(
          mintId,
          "COMPLETED",
          undefined,
          result.transactionId
        );
        console.log(`Mint ${mintId} completed successfully`);
      } else {
        await this.updateMintStatus(mintId, "FAILED", result.error);
        console.error(`Mint ${mintId} failed processing`);
        throw new Error(`Mint ${mintId} failed processing`);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Unknown ProcessorService error";

      // always update the record on any failure
      try {
        await this.updateMintStatus(mintId, "FAILED", errorMsg);
      } catch (dbError) {
        console.error("Failed to update DynamoDB:", dbError);
      }

      throw error;
    }
  }

  private async getMintRecord(mintId: string) {
    const result = await dynamoDbClient.send(
      new dynamodb.GetItemCommand({
        TableName: this.env.MINT_TABLE_NAME,
        Key: marshall({ [this.env.MINT_PARTITION_KEY]: mintId }),
      })
    );

    const item = result.Item;
    if (!item) {
      throw new Error(
        `DynamoDb item does not exist. Table: ${this.env.MINT_TABLE_NAME}, partitionKey: ${this.env.MINT_PARTITION_KEY}`
      );
    }

    return unmarshall(item) as IMintDBObject;
  }

  private async updateMintStatus(
    mintId: string,
    status: string,
    errorMessage?: string,
    transactionId?: string
  ): Promise<void> {
    console.log(`Updateing mint ${mintId} with status: ${status}`, {
      errorMessage,
      transactionId,
    });

    let updateExpression = "SET #status = :status, updatedAt = :updatedAt";
    const expressionAttributeNames = { "#status": "status" };
    const expressionAttributeValues: any = {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
    };

    if (errorMessage) {
      updateExpression += ", errorMessage = :error";
      expressionAttributeValues[":error"] = errorMessage;
    }

    if (transactionId) {
      updateExpression += ", transactionId = :transactionId";
      expressionAttributeValues[":transactionId"] = transactionId;
    }

    await dynamoDbClient.send(
      new dynamodb.UpdateItemCommand({
        TableName: this.env.MINT_TABLE_NAME,
        Key: marshall({ [this.env.MINT_PARTITION_KEY]: mintId }),
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
      })
    );
  }

  // simulates calling an external service that takes 5s to finish and fails 40% of the time
  private async callExternalService(mintRecord: IMintDBObject) {
    console.log(`Calling external service for mint ${mintRecord.mintId}`);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const isSuccess = Math.random() > 0.4;

    console.log("External service result", { isSuccess });

    if (isSuccess) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
      };
    } else {
      return {
        success: false,
        error: "External service failed",
      };
    }
  }
}
