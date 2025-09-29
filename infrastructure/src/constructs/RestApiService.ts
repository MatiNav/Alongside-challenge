import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

export interface RestApiServiceProps extends cdk.StackProps {
  apiUrl: string;
  zone: route53.IHostedZone;
  certificate: acm.ICertificate;
  apiSubdomain: string;
}

export class RestApiService extends Construct {
  public restApi: apigateway.RestApi;
  private resources: Map<string, apigateway.Resource> = new Map();

  constructor(scope: Construct, id: string, props: RestApiServiceProps) {
    super(scope, id);
    const { apiUrl, zone, certificate, apiSubdomain } = props;

    // TODO: handle cors properly
    this.restApi = new apigateway.RestApi(this, "SettlementAPI", {
      domainName: {
        domainName: apiUrl,
        certificate,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowCredentials: true,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    new route53.ARecord(this, "SettlementRestApiRecord", {
      zone,
      recordName: apiSubdomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGateway(this.restApi)
      ),
    });

    this.setupGatewayResponses();

    new cdk.CfnOutput(this, "ApiUrl", {
      exportName: "SettlementApiUrl",
      value: `https://${apiUrl}`,
      description: "API URL",
    });
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
