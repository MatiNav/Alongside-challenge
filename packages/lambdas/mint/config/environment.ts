export interface IBaseEnvironment {
  [key: string]: string;
}

export interface IMintSetterLambdaEnvironment extends IBaseEnvironment {
  MINT_TABLE_NAME: string;
  MINT_PARTITION_KEY: string;
  PROCESSING_QUEUE_URL: string;
}

export interface IMintGetterLambdaEnvironment extends IBaseEnvironment {
  MINT_TABLE_NAME: string;
  MINT_PARTITION_KEY: string;
}

class EnvironmentError extends Error {
  constructor(variable: string) {
    super(`Required environment variable ${variable} is not defined`);
    this.name = "EnvironmentError";
  }
}

export const validateEnvironment = <T extends IBaseEnvironment>(
  requiredKeys: (keyof T)[]
): T => {
  const envVars: Partial<T> = {};

  for (const key of requiredKeys) {
    const value = process.env[key as string];
    if (!value) {
      throw new EnvironmentError(key as string);
    }
    envVars[key] = value as T[keyof T];
  }

  return envVars as T;
};

export const validateMintSetterEnvironment =
  (): IMintSetterLambdaEnvironment => {
    return validateEnvironment<IMintSetterLambdaEnvironment>([
      "MINT_TABLE_NAME",
      "MINT_PARTITION_KEY",
      "PROCESSING_QUEUE_URL",
    ]);
  };

export const validateMintGetterEnvironment =
  (): IMintGetterLambdaEnvironment => {
    return validateEnvironment<IMintGetterLambdaEnvironment>([
      "MINT_TABLE_NAME",
      "MINT_PARTITION_KEY",
    ]);
  };
