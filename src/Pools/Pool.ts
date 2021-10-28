import Web3 from "web3";
import { PoolManager } from "./PoolManager";

export class Pool {
  constructor(private _web3: Web3, private _lockedStakingAddesses: string[], private _apeStakingAddress?: string, private _apeFarmingAddress?: string) { }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
      staking: PoolManager.getAll().filter(pool => !pool.isFarming).map(pool => {
        return pool.toJSON()
      }),
      farming: PoolManager.getAll().filter(pool => pool.isFarming).map(pool => {
        return pool.toJSON()
      })
    }))
  }
}
