import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface RestApiServiceProps extends cdk.StackProps {}

/**
 * This should:
 * - save the mint request in the db with state of "processing", push the message into the sqs queue, and return
 *  successfully to the front
 *
 * For this we have to create the api gateway, create the lambda, create the sqs resource
 * and create the dynamodb table.
 */

export class RestApiService extends Construct {
  public restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: RestApiServiceProps) {
    super(scope, id);

    // TODO: handle cors properly
    this.restApi = new apigateway.RestApi(this, "settlementAPI", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowCredentials: true,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });
  }

  addTranslateMethod({
    httpMethod,
    lambda,
  }: {
    httpMethod: string;
    lambda: lambda.IFunction;
  }) {
    this.restApi.root.addMethod(
      httpMethod,
      new apigateway.LambdaIntegration(lambda)
    );
  }
}
