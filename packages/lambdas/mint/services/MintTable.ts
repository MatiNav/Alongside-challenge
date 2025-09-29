import {
  ICreateMintRequest,
  IMintDBObject,
  IPaginationResult,
} from "@alongside/shared-types";
import * as dynamodb from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export class MintTable {
  dynamoDbClient: dynamodb.DynamoDBClient;

  constructor(
    private readonly tableName: string,
    private readonly partitionKey: string
  ) {
    this.dynamoDbClient = new dynamodb.DynamoDBClient({});
  }

  async insert(mintId: string, { amount, token }: ICreateMintRequest) {
    console.log(`Saving Mint ${mintId} to DynamoDb`);

    const mintData: IMintDBObject = {
      mintId,
      status: "PENDING",
      amount,
      token,
      createdAt: new Date().toISOString(),
      entityType: "MINT",
    };

    const tableInsertCmd: dynamodb.PutItemCommandInput = {
      TableName: this.tableName,
      Item: marshall(mintData),
    };

    await this.dynamoDbClient.send(new dynamodb.PutItemCommand(tableInsertCmd));

    console.log("Mint saved to DynamoDB:", mintData.mintId);

    return mintData;
  }

  async getOne(mintId: string) {
    const result = await this.dynamoDbClient.send(
      new dynamodb.GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ [this.partitionKey]: mintId }),
      })
    );

    const item = result.Item;
    if (!item) {
      throw new Error(
        `DynamoDb item does not exist. Table: ${this.tableName}, partitionKey: ${this.partitionKey}`
      );
    }

    return unmarshall(item) as IMintDBObject;
  }

  async getMany(
    limit: number,
    exclusiveStartKey?: string
  ): Promise<IPaginationResult<IMintDBObject>> {
    console.log("Getting items from mint table", { limit, exclusiveStartKey });

    const queryCmd: dynamodb.QueryCommandInput = {
      TableName: this.tableName,
      IndexName: "CreatedAtIndex",
      KeyConditionExpression: "entityType = :entityType",
      ExpressionAttributeValues: marshall({
        ":entityType": "MINT",
      }),
      ScanIndexForward: false, // false = descending order (newest first)
      Limit: limit,
    };

    // If we have a pagination token, use it
    if (exclusiveStartKey) {
      try {
        queryCmd.ExclusiveStartKey = JSON.parse(
          Buffer.from(exclusiveStartKey, "base64").toString("utf-8")
        );
      } catch (error) {
        throw new Error("Invalid pagination token");
      }
    }

    const result = await this.dynamoDbClient.send(
      new dynamodb.QueryCommand(queryCmd)
    );

    if (!result.Items) {
      return {
        items: [],
        hasMore: false,
      };
    }

    const items = result.Items.map((item) =>
      unmarshall(item)
    ) as IMintDBObject[];

    // Create pagination token for next page
    let nextToken: string | undefined;
    if (result.LastEvaluatedKey) {
      nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString(
        "base64"
      );
    }

    return {
      items,
      lastEvaluatedKey: nextToken,
      hasMore: !!result.LastEvaluatedKey,
    };
  }

  async updateMintStatus(
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

    await this.dynamoDbClient.send(
      new dynamodb.UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ [this.partitionKey]: mintId }),
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
      })
    );
  }
}
