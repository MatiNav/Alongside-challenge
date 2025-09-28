export interface ILambdaEnvironment {
  MINT_TABLE_NAME: string;
  MINT_PARTITION_KEY: string;
  PROCESSING_QUEUE_URL: string;
}

class EnvironmentError extends Error {
  constructor(variable: string) {
    super(`Required environment variable ${variable} is not defined`);
    this.name = "EnvironmentError";
  }
}

const validateEnvironment = (): ILambdaEnvironment => {
  const requiredVars = {
    MINT_TABLE_NAME: process.env.MINT_TABLE_NAME,
    MINT_PARTITION_KEY: process.env.MINT_PARTITION_KEY,
    PROCESSING_QUEUE_URL: process.env.PROCESSING_QUEUE_URL,
  };

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      throw new EnvironmentError(key);
    }
  }

  return requiredVars as ILambdaEnvironment;
};

export const env = validateEnvironment();
