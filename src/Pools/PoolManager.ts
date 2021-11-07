import { PoolBase } from "../Interfaces/PoolBase";

export class PoolManager {
  private static _pools: PoolBase[] = [];

  static getAll(): PoolBase[] {
    return this._pools
  }

  static getPool(contractAddress: string): PoolBase | undefined {
    return this._pools.find((pool: PoolBase) => pool.contractAddress == contractAddress);
  }

  static addPool(pool: PoolBase): void {
    this._pools.push(pool);
  }

}