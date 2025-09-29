import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  DashboardService,
  RestApiService,
  SettlementProcessorService,
  SettlementService,
} from "../constructs";
import { CertificateWrapper } from "../constructs/CertificateWrapper";
import { MonitoringService } from "../constructs/MonitoringService";
import { StaticWebsiteDeploymnet } from "../constructs/StaticWebsiteDeployment";
import { getConfig } from "../helpers";
import { applyTagsToConstruct, applyTagsToStack } from "../helpers/tags";

export class SettlementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const config = getConfig();

    applyTagsToStack(this, {
      environment: "prod",
      project: "alongside-challenge",
    });

    const domain = config.domain;
    const webUrl = `${config.webSubdomain}.${config.domain}`;
    const apiUrl = `${config.apiSubdomain}.${config.domain}`;

    const certificateWrapper = new CertificateWrapper(
      this,
      "CertificateWrapper",
      {
        domain,
        webUrl,
        apiUrl,
      }
    );

    const restApi = new RestApiService(this, "MainApi", {
      apiUrl,
      zone: certificateWrapper.zone,
      certificate: certificateWrapper.certificate,
      apiSubdomain: config.apiSubdomain,
    });

    applyTagsToConstruct(restApi, {
      service: "settlement",
      component: "api",
    });

    const settlementService = new SettlementService(this, "SettlementService", {
      restApi,
    });

    applyTagsToConstruct(settlementService, {
      service: "settlement",
      component: "creating",
    });

    const processorService = new SettlementProcessorService(
      this,
      "ProcessorService",
      {
        table: settlementService.table,
        processingQueue: settlementService.processingQueue,
      }
    );

    applyTagsToConstruct(processorService, {
      service: "settlement",
      component: "processing",
    });

    const dashboardService = new DashboardService(this, "DashboardService", {
      restApi,
      table: settlementService.table,
    });

    applyTagsToConstruct(dashboardService, {
      service: "settlement",
      component: "reading",
    });

    const websiteDeployment = new StaticWebsiteDeploymnet(
      this,
      "WebsiteDeployment",
      {
        certificate: certificateWrapper.certificate,
        domain,
        webUrl,
        zone: certificateWrapper.zone,
        projectName: config.projectName,
        webSubdomain: config.webSubdomain,
      }
    );

    applyTagsToConstruct(websiteDeployment, {
      service: "frontend",
      component: "hosting",
    });

    const monitoring = new MonitoringService(this, "MonitoringService", {
      mintLambda: settlementService.mintLambda, // You'll need to expose this
      dashboardLambda: dashboardService.getMintsLambda, // You'll need to expose this
      processingQueue: settlementService.processingQueue,
      deadLetterQueue: settlementService.dlq, // You'll need to expose this
      restApi: restApi.restApi,
    });

    applyTagsToConstruct(monitoring, {
      service: "monitoring",
      component: "observability",
    });

    new cdk.CfnOutput(this, `${config.projectName}MonitoringDashboardUrl`, {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: "CloudWatch Dashboard URL",
      exportName: `${config.projectName}MonitoringDashboardUrl`,
    });
  }
}
