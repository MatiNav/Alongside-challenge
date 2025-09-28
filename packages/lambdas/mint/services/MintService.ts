import { IMintDBObject, IMintRequest } from "@alongside/shared-types";
import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as sqs from "@aws-sdk/client-sqs";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { ILambdaEnvironment } from "../config/environment";

const dynamoDbClient = new dynamodb.DynamoDBClient({});
const sqsClient = new sqs.SQSClient({});

export class MintService {
  constructor(private readonly env: ILambdaEnvironment) {}

  async createMint(request: IMintRequest) {
    const mintId = randomUUID();

    const mint = await this.saveMintToDatabase(mintId, request);

    await this.publishMintEvent(mint);

    return {
      mintId,
      status: "PENDING",
    };
  }

  private async saveMintToDatabase(
    mintId: string,
    { amount, token }: IMintRequest
  ) {
    console.log(`Saving Mint ${mintId} to DynamoDb`);

    const mintData: IMintDBObject = {
      mintId,
      status: "PENDING",
      amount,
      token,
      createdAt: new Date().toISOString(),
    };

    const tableInsertCmd: dynamodb.PutItemCommandInput = {
      TableName: this.env.MINT_TABLE_NAME,
      Item: marshall(mintData),
    };

    await dynamoDbClient.send(new dynamodb.PutItemCommand(tableInsertCmd));

    console.log("Mint saved to DynamoDB:", mintData.mintId);

    return mintData;
  }

  private async publishMintEvent(mint: IMintDBObject) {
    console.log(`Publishing event mint ${mint.mintId} to Sqs`);

    const sqsEventType = "MINT_CREATED";

    const sqsMessage = {
      mintId: mint.mintId,
      eventType: sqsEventType,
      createdAt: mint.createdAt,
    };

    await sqsClient.send(
      new sqs.SendMessageCommand({
        QueueUrl: this.env.PROCESSING_QUEUE_URL,
        MessageBody: JSON.stringify(sqsMessage),
        MessageAttributes: {
          eventType: {
            DataType: "String",
            StringValue: sqsEventType,
          },
          source: {
            DataType: "String",
            StringValue: "mint-service",
          },
          mintId: {
            DataType: "String",
            StringValue: mint.mintId,
          },
        },
      })
    );

    console.log("Message published to SQS:", mint.mintId);
  }
}
