import * as cdk from "aws-cdk-lib";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { createNodeJsLambda } from "../helpers/lambdaNodejsWrapper";
import { RestApiService } from "./RestApiService";

const MINT_PARTITION_KEY = "mintId";

export interface SettlementServiceProps extends cdk.StackProps {
  restApi: RestApiService;
}

export class SettlementService extends Construct {
  constructor(scope: Construct, id: string, props: SettlementServiceProps) {
    super(scope, id);

    const { restApi } = props;

    const table = new dynamoDb.Table(this, "mints", {
      tableName: "mint",
      partitionKey: {
        name: MINT_PARTITION_KEY,
        type: dynamoDb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const processingQueue = new sqs.Queue(this, "SettlementProcessingQueue", {
      queueName: "settlement-processing-queue",
      visibilityTimeout: cdk.Duration.minutes(5),
      retentionPeriod: cdk.Duration.days(14),
    });

    const mintTablePolicy = new iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: [table.tableArn],
    });

    const mintLambda = createNodeJsLambda(this, "mintLambda", {
      lambdaRelPath: "mint/index.ts",
      handler: "mint",
      initialPolicy: [mintTablePolicy],
      environment: {
        MINT_TABLE_NAME: table.tableName,
        MINT_PARTITION_KEY: MINT_PARTITION_KEY,
        PROCESSING_QUEUE_URL: processingQueue.queueUrl,
      },
    });

    processingQueue.grantSendMessages(mintLambda);

    restApi.addTranslateMethod({
      httpMethod: "POST",
      lambda: mintLambda,
    });
  }
}
