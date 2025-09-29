import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface ICertificateWrapperProps extends cdk.StackProps {
  domain: string;
  webUrl: string;
  apiUrl: string;
}

export class CertificateWrapper extends Construct {
  public zone: route53.IHostedZone;
  public certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: ICertificateWrapperProps) {
    super(scope, id);

    const { domain } = props;

    this.zone = route53.HostedZone.fromLookup(this, "SettlementZone", {
      domainName: domain,
    });

    this.certificate = new acm.Certificate(this, "AlongsideCertificate", {
      domainName: `alongside.${domain}`,
      subjectAlternativeNames: [`alongside-api.${domain}`],
      validation: acm.CertificateValidation.fromDns(this.zone),
    });
  }
}
