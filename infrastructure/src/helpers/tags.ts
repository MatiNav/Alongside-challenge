import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface TaggingConfig {
  environment: string;
  project: string;
  service?: string;
  component?: string;
}

export const applyTagsToConstruct = (
  construct: Construct,
  tags: Partial<TaggingConfig>
): void => {
  Object.entries(tags).forEach(([key, value]) => {
    cdk.Tags.of(construct).add(key, value);
  });
};

export const applyTagsToStack = (
  stack: cdk.Stack,
  tags: Partial<TaggingConfig> = {}
): void => {
  applyTagsToConstruct(stack, tags);
};
