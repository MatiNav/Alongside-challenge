import { IMintGetterLambdaEnvironment } from "../config/environment";
import { MintTable } from "./MintTable";

export class GetterService {
  mintTable: MintTable;

  constructor(env: IMintGetterLambdaEnvironment) {
    this.mintTable = new MintTable(env.MINT_TABLE_NAME, env.MINT_PARTITION_KEY);
  }

  async getMints(limit: number, exclusiveStartKey?: string) {
    const result = await this.mintTable.getMany(limit, exclusiveStartKey);

    return {
      items: result.items,
      nextToken: result.lastEvaluatedKey,
      hasMore: result.hasMore,
    };
  }
}
