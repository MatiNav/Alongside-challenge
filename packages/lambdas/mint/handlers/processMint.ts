import * as lambda from "aws-lambda";
import { env } from "../config/environment";
import { ProcessorService } from "../services/ProcessorService";

const processorService = new ProcessorService(env);

export const handler: lambda.SQSHandler = async (event) => {
  try {
    console.log(`Processing ${event.Records.length} messages`);

    if (event.Records.length > 1) {
      throw new Error("ProcessMintLambda should process 1 record");
    }

    await processRecord(event.Records[0]);
  } catch (error: unknown) {
    console.error(error);
    throw error;
  }
};

const processRecord = async (record: lambda.SQSRecord) => {
  let mintId: string | undefined;

  try {
    const message = JSON.parse(record.body);
    mintId = message.mintId;

    if (!mintId) {
      throw new Error("Record mintId is not defined");
    }

    console.log(`Processing mint: ${mintId}`);

    await processorService.processMint(mintId);

    console.log(`Successfully processed mintId: ${mintId}`);
  } catch (error) {
    console.error(`Failed to process mint ${mintId}`, error);

    throw error;
  }
};
