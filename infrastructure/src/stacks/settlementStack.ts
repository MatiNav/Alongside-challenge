import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApiService } from "../constructs/RestApiService";
import { SettlementService } from "../constructs/SettlementService";

export class SettlementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const restApi = new RestApiService(this, "MainApi", {});

    new SettlementService(this, "SettlementService", {
      restApi,
    });

    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: restApi.restApi.url,
      description: "API Gateway Url",
      exportName: "SettlementApiUrl",
    });
  }
}
