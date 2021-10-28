import { PoolContract } from "../Contracts/PoolContract";

export class PoolManager {
  private static _pools: PoolContract[] = [];

  static getAll(): PoolContract[] {
    return this._pools
  }

  static getPool(contractAddress: string): PoolContract | undefined {
    return this._pools.find((pool: PoolContract) => pool.contractAddress == contractAddress);
  }

  static addPool(pool: PoolContract): void {
    this._pools.push(pool);
  }

}