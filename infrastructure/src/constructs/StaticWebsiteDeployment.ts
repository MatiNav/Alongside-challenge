import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { frontendDistPath } from "../helpers";

export interface IStaticWebsiteDeploymnetProps extends cdk.StackProps {
  domain: string;
  webUrl: string;
  projectName: string;
  webSubdomain: string;
  zone: route53.IHostedZone;
  certificate: acm.ICertificate;
}

export class StaticWebsiteDeploymnet extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: IStaticWebsiteDeploymnetProps
  ) {
    super(scope, id);

    const { domain, webUrl, certificate, zone, projectName, webSubdomain } =
      props;

    const bucket = new s3.Bucket(this, "SettlementWebsiteBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "404.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distro = this.createDistribution(bucket, {
      domain,
      webUrl,
      certificate,
      projectName,
    });

    new s3deploy.BucketDeployment(this, "WebsiteDeploy", {
      destinationBucket: bucket,
      sources: [s3deploy.Source.asset(frontendDistPath)],
      distribution: distro,
      distributionPaths: ["/*"],
    });

    new route53.ARecord(this, `${projectName}route53Url`, {
      zone,
      recordName: webSubdomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distro)
      ),
    });

    new cdk.CfnOutput(this, `${projectName}WebUrl`, {
      exportName: `${projectName}WebUrl`,
      value: `https://${distro.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, "DistributionId", {
      exportName: `${projectName}distributionId`,
      value: distro.distributionId,
    });
  }

  private createDistribution(
    bucket: s3.Bucket,
    config: {
      domain: string;
      webUrl: string;
      certificate: acm.ICertificate;
      projectName: string;
    }
  ): cloudfront.Distribution {
    const { domain, webUrl, certificate, projectName } = config;

    return new cloudfront.Distribution(
      this,
      "SettlementWebsiteCloudfrontDist",
      {
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
        certificate,
        domainNames: [webUrl],
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 404,
            responsePagePath: "/404.html",
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 404,
            responsePagePath: "/404.html",
            ttl: cdk.Duration.minutes(5),
          },
        ],
        comment: `${projectName} Website Distribution`,
      }
    );
  }
}
