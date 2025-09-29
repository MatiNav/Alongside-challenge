import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export interface MonitoringServiceProps {
  mintLambda: lambda.Function;
  dashboardLambda: lambda.Function;
  processingQueue: sqs.Queue;
  deadLetterQueue: sqs.Queue;
  restApi: apigateway.RestApi;
}

export class MonitoringService extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringServiceProps) {
    super(scope, id);

    const {
      mintLambda,
      dashboardLambda,
      processingQueue,
      deadLetterQueue,
      restApi,
    } = props;

    this.createAlarms(mintLambda, dashboardLambda, deadLetterQueue);

    this.dashboard = this.createDashboard(
      mintLambda,
      dashboardLambda,
      processingQueue,
      deadLetterQueue,
      restApi
    );
  }

  private createAlarms(
    mintLambda: lambda.Function,
    dashboardLambda: lambda.Function,
    deadLetterQueue: sqs.Queue
  ) {
    new cloudwatch.Alarm(this, "MintLambdaErrorAlarm", {
      alarmName: "alongside-mint-lambda-errors",
      alarmDescription: "Mint Lambda error rate is too high",
      metric: mintLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, "MintLambdaDurationAlarm", {
      alarmName: "alongside-mint-lambda-duration",
      alarmDescription: "Mint Lambda taking too long",
      metric: mintLambda.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: "Average",
      }),
      threshold: 10000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, "DashboardLambdaErrorAlarm", {
      alarmName: "alongside-dashboard-lambda-errors",
      alarmDescription: "Dashboard Lambda error rate is too high",
      metric: dashboardLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 3,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    new cloudwatch.Alarm(this, "DLQMessagesAlarm", {
      alarmName: "alongside-dlq-messages",
      alarmDescription:
        "Messages in Dead Letter Queue - investigate processing failures",
      metric: deadLetterQueue.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(1),
        statistic: "Maximum",
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });
  }

  private createDashboard(
    mintLambda: lambda.Function,
    dashboardLambda: lambda.Function,
    processingQueue: sqs.Queue,
    deadLetterQueue: sqs.Queue,
    restApi: apigateway.RestApi
  ): cloudwatch.Dashboard {
    return new cloudwatch.Dashboard(this, "AlongsideDashboard", {
      dashboardName: "alongside-challenge-monitoring",
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: "Mint Lambda - Invocations & Errors",
            left: [mintLambda.metricInvocations()],
            right: [mintLambda.metricErrors()],
            period: cdk.Duration.minutes(5),
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: "Mint Lambda - Duration",
            left: [
              mintLambda.metricDuration({
                statistic: "Average",
              }),
              mintLambda.metricDuration({
                statistic: "Maximum",
              }),
            ],
            period: cdk.Duration.minutes(5),
            width: 12,
            height: 6,
          }),
        ],

        [
          new cloudwatch.GraphWidget({
            title: "Dashboard Lambda - Performance",
            left: [dashboardLambda.metricInvocations()],
            right: [dashboardLambda.metricErrors()],
            period: cdk.Duration.minutes(5),
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: "Dashboard Lambda - Duration",
            left: [
              dashboardLambda.metricDuration({
                statistic: "Average",
              }),
            ],
            period: cdk.Duration.minutes(5),
            width: 12,
            height: 6,
          }),
        ],

        [
          new cloudwatch.GraphWidget({
            title: "SQS Queue Metrics",
            left: [
              processingQueue.metricApproximateNumberOfMessagesVisible({
                label: "Messages in Queue",
              }),
              processingQueue.metricNumberOfMessagesSent({
                label: "Messages Sent",
              }),
            ],
            right: [
              deadLetterQueue.metricApproximateNumberOfMessagesVisible({
                label: "DLQ Messages",
              }),
            ],
            period: cdk.Duration.minutes(1),
            width: 24,
            height: 6,
          }),
        ],

        [
          new cloudwatch.GraphWidget({
            title: "API Gateway - Requests",
            left: [
              new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "Count",
                dimensionsMap: {
                  ApiName: restApi.restApiName,
                },
                statistic: "Sum",
              }),
            ],
            period: cdk.Duration.minutes(5),
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: "API Gateway - Errors",
            left: [
              new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "4XXError",
                dimensionsMap: {
                  ApiName: restApi.restApiName,
                },
                statistic: "Sum",
              }),
              new cloudwatch.Metric({
                namespace: "AWS/ApiGateway",
                metricName: "5XXError",
                dimensionsMap: {
                  ApiName: restApi.restApiName,
                },
                statistic: "Sum",
              }),
            ],
            period: cdk.Duration.minutes(5),
            width: 12,
            height: 6,
          }),
        ],
      ],
    });
  }
}
