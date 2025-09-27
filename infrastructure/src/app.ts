#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { getConfig } from "./helpers";
import { SettlementStack } from "./stacks";

const config = getConfig();

const app = new cdk.App();
new SettlementStack(app, "SettlementStack", {
  env: {
    account: config.awsAccountId,
    region: config.awsRegion,
  },
});
