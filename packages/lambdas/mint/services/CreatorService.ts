import { ICreateMintRequest, IMintDBObject } from "@alongside/shared-types";
import * as sqs from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";
import { IMintSetterLambdaEnvironment } from "../config/environment";
import { MintTable } from "./MintTable";

const sqsClient = new sqs.SQSClient({});

export class CreatorService {
  private mintTable: MintTable;
  private queueUrl: string;

  constructor(env: IMintSetterLambdaEnvironment) {
    this.mintTable = new MintTable(env.MINT_TABLE_NAME, env.MINT_PARTITION_KEY);
    this.queueUrl = env.PROCESSING_QUEUE_URL;
  }

  async createMint(request: ICreateMintRequest) {
    const mintId = randomUUID();

    const mint = await this.mintTable.insert(mintId, request);

    await this.publishMintEvent(mint);

    return {
      mintId,
      status: "PENDING",
    };
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
        QueueUrl: this.queueUrl,
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
