import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { createNodeJsLambda } from "../helpers/lambdaNodejsWrapper";
import { MINT_PARTITION_KEY } from "./SettlementService";

export interface ISettlementProcessorServiceProps extends cdk.StackProps {
  table: dynamodb.Table;
  processingQueue: sqs.Queue;
}

export class SettlementProcessorService extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ISettlementProcessorServiceProps
  ) {
    super(scope, id);

    const { table, processingQueue } = props;

    const mintTablePolicy = new iam.PolicyStatement({
      actions: ["dynamodb:UpdateItem", "dynamodb:Scan", "dynamodb:GetItem"],
      resources: [table.tableArn],
    });

    const mintProcessorLambda = createNodeJsLambda(
      this,
      "mintProcessorLambda",
      {
        lambdaRelPath: "mint/index.ts",
        handler: "processMint",
        initialPolicy: [mintTablePolicy],
        environment: {
          MINT_TABLE_NAME: table.tableName,
          MINT_PARTITION_KEY: MINT_PARTITION_KEY,
          PROCESSING_QUEUE_URL: processingQueue.queueUrl,
        },
        timeout: cdk.Duration.seconds(30),
      }
    );

    mintProcessorLambda.addEventSource(
      new SqsEventSource(processingQueue, {
        batchSize: 1,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );
  }
}
