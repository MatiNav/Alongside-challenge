#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { getConfig } from "./helpers";
import { SettlementServiceStack } from "./stacks/settlementStack";

const config = getConfig();

const app = new cdk.App();
new SettlementServiceStack(app, "InfrastructureStack", {
  env: {
    account: config.awsAccountId,
    region: config.awsRegion,
  },
});
