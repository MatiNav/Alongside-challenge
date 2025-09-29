import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  DashboardService,
  RestApiService,
  SettlementProcessorService,
  SettlementService,
} from "../constructs";
import { CertificateWrapper } from "../constructs/CertificateWrapper";
import { StaticWebsiteDeploymnet } from "../constructs/StaticWebsiteDeployment";
import { getConfig } from "../helpers";

export class SettlementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const config = getConfig();

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

    const settlementService = new SettlementService(this, "SettlementService", {
      restApi,
    });

    new SettlementProcessorService(this, "ProcessorService", {
      table: settlementService.table,
      processingQueue: settlementService.processingQueue,
    });

    new DashboardService(this, "DashboardService", {
      restApi,
      table: settlementService.table,
    });

    new StaticWebsiteDeploymnet(this, "WebsiteDeployment", {
      certificate: certificateWrapper.certificate,
      domain,
      webUrl,
      zone: certificateWrapper.zone,
      projectName: config.projectName,
      webSubdomain: config.webSubdomain,
    });
  }
}
