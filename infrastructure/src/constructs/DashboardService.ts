import * as cdk from "aws-cdk-lib";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { createNodeJsLambda } from "../helpers/lambdaNodejsWrapper";
import { RestApiService } from "./RestApiService";
import { MINT_PARTITION_KEY } from "./SettlementService";

interface IDashboardServiceProps extends cdk.StackProps {
  restApi: RestApiService;
  table: dynamoDb.Table;
}

export class DashboardService extends Construct {
  constructor(scope: Construct, id: string, props: IDashboardServiceProps) {
    super(scope, id);

    const { table, restApi } = props;

    const mintTablePolicy = new iam.PolicyStatement({
      actions: ["dynamodb:Query", "dynamodb:Scan", "dynamodb:GetItem"],
      resources: [table.tableArn, `${table.tableArn}/index/*`],
    });

    const getMintsLambda = createNodeJsLambda(this, "getMintsLambda", {
      lambdaRelPath: "mint/index.ts",
      handler: "getMints",
      initialPolicy: [mintTablePolicy],
      environment: {
        MINT_TABLE_NAME: table.tableName,
        MINT_PARTITION_KEY: MINT_PARTITION_KEY,
      },
    });

    restApi.addMethodToResource({
      httpMethod: "GET",
      resourcePath: "mint",
      lambda: getMintsLambda,
    });
  }
}
