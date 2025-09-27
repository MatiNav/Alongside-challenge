#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SettlementServiceStack } from "./stacks/settlementStack";

const app = new cdk.App();
new SettlementServiceStack(app, "InfrastructureStack", {});
