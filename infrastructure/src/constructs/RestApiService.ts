import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface RestApiServiceProps extends cdk.StackProps {}

export class RestApiService extends Construct {
  public restApi: apigateway.RestApi;
  private resources: Map<string, apigateway.Resource> = new Map();

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

    this.setupGatewayResponses();
  }

  private setupGatewayResponses() {
    new apigateway.GatewayResponse(this, "ResourceNotFoundResponse", {
      restApi: this.restApi,
      type: apigateway.ResponseType.RESOURCE_NOT_FOUND,
      responseHeaders: {
        "Content-Type": "'application/json'",
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'*'",
      },
      templates: {
        "application/json": JSON.stringify({
          error: "Not Found",
          message: "The requested resource does not exist",
          statusCode: 404,
        }),
      },
    });
  }

  private getOrCreateResource(resourcepath: string) {
    if (this.resources.has(resourcepath)) {
      return this.resources.get(resourcepath)!;
    }

    const resource = this.restApi.root.addResource(resourcepath);
    this.resources.set(resourcepath, resource);
    return resource;
  }

  addMethodToResource({
    httpMethod,
    resourcePath,
    lambda,
  }: {
    httpMethod: string;
    resourcePath: string;
    lambda: lambda.IFunction;
  }) {
    const resource = this.getOrCreateResource(resourcePath);
    resource.addMethod(httpMethod, new apigateway.LambdaIntegration(lambda));
  }
}
