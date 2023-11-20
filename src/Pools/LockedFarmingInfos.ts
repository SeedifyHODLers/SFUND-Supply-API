import { FarmInfos } from "./FarmInfos"
import {getChainName} from "../utils";

export class LockedFarmingInfos extends FarmInfos {
  private _lockDuration: number
  private _depositTime: number

  constructor(tokens: Map<string, number>, pendingReward: Map<string, number>, rewardPerSec: number, symbol: string, lp: number, totalSupply: number,
    depositTime: number, lockDuration: number, chainId: number) {
    super(tokens, pendingReward, rewardPerSec, symbol, lp, totalSupply, chainId)
    this._lockDuration = lockDuration
    this._depositTime = depositTime
  }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
      "chain": getChainName(this.chainId),
      "symbol": this.symbol,
      "lp": this.lp,
      "totalSupply": this.totalSupply,
      "tokens": Object.fromEntries(this.tokens.entries()),
      "pendingReward": Object.fromEntries(this.pendingReward.entries()),
      "rewardPerSec": this.rewardPerSec,
      "lockDuration": this._lockDuration,
      "depositTime": this._depositTime,
    }))
  }
}
