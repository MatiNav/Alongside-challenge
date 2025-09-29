import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { createNodeJsLambda } from "../helpers/lambdaNodejsWrapper";
import { RestApiService } from "./RestApiService";

export const MINT_PARTITION_KEY = "mintId";

export interface SettlementServiceProps extends cdk.StackProps {
  restApi: RestApiService;
}

export class SettlementService extends Construct {
  public table: dynamoDb.Table;
  public processingQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: SettlementServiceProps) {
    super(scope, id);

    const { restApi } = props;

    this.table = new dynamoDb.Table(this, "mints", {
      tableName: "mint",
      partitionKey: {
        name: MINT_PARTITION_KEY,
        type: dynamoDb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "CreatedAtIndex",
      partitionKey: {
        name: "entityType",
        type: dynamoDb.AttributeType.STRING,
      },
      sortKey: {
        name: "createdAt",
        type: dynamoDb.AttributeType.STRING,
      },
      projectionType: dynamoDb.ProjectionType.ALL,
    });

    const dlq = new sqs.Queue(this, "SettlementProcessingDLQ", {
      queueName: "settlement-processing-dlq",
    });

    this.processingQueue = new sqs.Queue(this, "SettlementProcessingQueue", {
      queueName: "settlement-processing-queue",
      visibilityTimeout: cdk.Duration.minutes(5),
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 1,
      },
    });

    // In a real project, we should defined the strategy for handling
    // failed mints.
    new cloudwatch.Alarm(this, "DLQMessagesAlarm", {
      metric: dlq.metricApproximateNumberOfMessagesVisible({
        statistic: "Sum",
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    const mintTablePolicy = new iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: [this.table.tableArn],
    });

    const mintLambda = createNodeJsLambda(this, "mintLambda", {
      lambdaRelPath: "mint/handlers/createMint.ts",
      handler: "handler",
      initialPolicy: [mintTablePolicy],
      environment: {
        MINT_TABLE_NAME: this.table.tableName,
        MINT_PARTITION_KEY: MINT_PARTITION_KEY,
        PROCESSING_QUEUE_URL: this.processingQueue.queueUrl,
      },
    });

    this.processingQueue.grantSendMessages(mintLambda);

    restApi.addMethodToResource({
      httpMethod: "POST",
      resourcePath: "mint",
      lambda: mintLambda,
    });
  }
}
