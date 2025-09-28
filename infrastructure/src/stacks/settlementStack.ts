import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  RestApiService,
  SettlementProcessorService,
  SettlementService,
} from "../constructs";

export class SettlementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const restApi = new RestApiService(this, "MainApi", {});

    const settlementService = new SettlementService(this, "SettlementService", {
      restApi,
    });

    new SettlementProcessorService(this, "SettlementProcessorService", {
      table: settlementService.table,
      processingQueue: settlementService.processingQueue,
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: restApi.restApi.url,
      description: "API Gateway Url",
      exportName: "SettlementApiUrl",
    });
  }
}
