import * as dotenv from "dotenv";

export const getConfig = () => {
  dotenv.config({ path: "../.env" });
  const {
    AWS_ACCOUNT_ID,
    AWS_REGION,
    AWS_CERT_ID,
    DOMAIN,
    API_SUBDOMAIN,
    WEB_SUBDOMAIN,
    PROJECT_NAME,
  } = process.env;

  if (!AWS_ACCOUNT_ID) {
    throw new Error("AWS_ACCOUNT_ID is not defined");
  }
  if (!AWS_REGION) {
    throw new Error("AWS_REGION is not defined");
  }
  if (!AWS_CERT_ID) {
    throw new Error("AWS_CERT_ID is not defined");
  }
  if (!DOMAIN) {
    throw new Error("DOMAIN is not defined");
  }
  if (!API_SUBDOMAIN) {
    throw new Error("API_SUBDOMAIN is not defined");
  }
  if (!WEB_SUBDOMAIN) {
    throw new Error("WEB_SUBDOMAIN is not defined");
  }
  if (!PROJECT_NAME) {
    throw new Error("PROJECT_NAME is not defined.");
  }

  return {
    awsAccountId: AWS_ACCOUNT_ID,
    awsRegion: AWS_REGION,
    awsCertId: AWS_CERT_ID,
    domain: DOMAIN,
    apiSubdomain: API_SUBDOMAIN,
    webSubdomain: WEB_SUBDOMAIN,
    projectName: PROJECT_NAME,
  };
};
