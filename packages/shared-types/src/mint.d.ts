export type ICreateMintRequest = {
  amount: number;
  token: string;
};

export type IGetMintRequest = {
  limit: string;
  offset: string;
};

export type IPaginationResult<T> = {
  items: T[];
  nextToken?: string;
  hasMore: boolean;
};

export type IMintDBObject = ICreateMintRequest & {
  mintId: string;
  status: string;
  createdAt: string;
  entityType: string;
  errorMessage?: string;
  transactionId?: string;
};
