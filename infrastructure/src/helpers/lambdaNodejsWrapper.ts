import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import fs from "fs";
import path from "path";
import { lambdasDirPath } from "./addPaths";

export type ILambdaWrapperProps = {
  lambdaRelPath: string;
  handler: string;
  initialPolicy?: iam.PolicyStatement[];
  environment?: Record<string, string>;
  timeout?: cdk.Duration;
};

export const createNodeJsLambda = (
  scope: Construct,
  lambdaName: string,
  {
    lambdaRelPath,
    handler,
    initialPolicy,
    environment,
    timeout,
  }: ILambdaWrapperProps
) => {
  const lambdaPath = path.join(lambdasDirPath, lambdaRelPath);

  if (!fs.existsSync(lambdaPath)) {
    throw new Error(`lambdaPath doesn't exist: ${lambdaPath}`);
  }

  return new lambdaNodeJs.NodejsFunction(scope, lambdaName, {
    entry: lambdaPath,
    handler,
    runtime: lambda.Runtime.NODEJS_20_X,
    initialPolicy,
    environment,
    timeout,
  });
};
