import { FarmInfos } from "./FarmInfos"

export class LockedFarmingInfos extends FarmInfos {
  private _lockDuration: number
  private _depositTime: number

  constructor(tokens: Map<string, number>, pendingReward: Map<string, number>, rewardPerSec: number, symbol: string, lp: number, totalSupply: number,
    depositTime: number, lockDuration: number) {
    super(tokens, pendingReward, rewardPerSec, symbol, lp, totalSupply)
    this._lockDuration = lockDuration
    this._depositTime = depositTime
  }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
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