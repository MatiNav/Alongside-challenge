export type IMintRequest = {
  amount: number;
  token: string;
};

export type IMintDBObject = IMintRequest & {
  mintId: string;
  status: string;
  createdAt: string;
};
