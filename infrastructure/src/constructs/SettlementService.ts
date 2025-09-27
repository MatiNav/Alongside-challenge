import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { createNodeJsLambda } from "../helpers/lambdaNodejsWrapper";
import { RestApiService } from "./RestApiService";

export interface SettlementServiceProps extends cdk.StackProps {
  restApi: RestApiService;
}

export class SettlementService extends Construct {
  constructor(scope: Construct, id: string, props: SettlementServiceProps) {
    super(scope, id);

    const { restApi } = props;

    const mintLambda = createNodeJsLambda(this, "mintLambda", {
      lambdaRelPath: "mint/index.ts",
      handler: "mint",
    });

    restApi.addTranslateMethod({
      httpMethod: "POST",
      lambda: mintLambda,
    });
  }
}
