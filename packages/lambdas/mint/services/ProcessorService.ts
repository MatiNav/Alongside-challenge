import { IMintDBObject } from "@alongside/shared-types";
import { IMintGetterLambdaEnvironment } from "../config/environment";
import { MintTable } from "./MintTable";

export class ProcessorService {
  private mintTable: MintTable;

  constructor(env: IMintGetterLambdaEnvironment) {
    this.mintTable = new MintTable(env.MINT_TABLE_NAME, env.MINT_PARTITION_KEY);
  }

  async processMint(mintId: string) {
    try {
      const mintRecord = await this.mintTable.getOne(mintId);

      if (mintRecord.status === "COMPLETED") {
        console.log(`Mint ${mintId} already completed`);
        return;
      }

      await this.mintTable.updateMintStatus(mintId, "PROCESSING");

      const result = await this.callExternalService(mintRecord);
      console.log(`External service response:`, result);

      if (result.success) {
        await this.mintTable.updateMintStatus(
          mintId,
          "COMPLETED",
          undefined,
          result.transactionId
        );
        console.log(`Mint ${mintId} completed successfully`);
      } else {
        await this.mintTable.updateMintStatus(mintId, "FAILED", result.error);
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
        await this.mintTable.updateMintStatus(mintId, "FAILED", errorMsg);
      } catch (dbError) {
        console.error("Failed to update DynamoDB:", dbError);
      }

      throw error;
    }
  }

  // simulates calling an external service that takes 5s to finish and fails 40% of the time
  private async callExternalService(mintRecord: IMintDBObject) {
    const probability = 0.5;
    console.log(
      `Calling external service for mint ${mintRecord.mintId}. Failure probability: ${probability}`
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const isSuccess = Math.random() > probability;

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
