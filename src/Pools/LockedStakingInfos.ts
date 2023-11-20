import { StakingInfos } from "./StakingInfos"
import {getChainName} from "../utils";

export class LockedStakingInfos extends StakingInfos {
  private _lockDuration: number
  private _endTime: number
  private _depositTime: number
  private _calculatedReward: Map<string, number>

  constructor(tokens: Map<string, number>, pendingReward: Map<string, number>, rewardPerSec: number, calculatedReward: Map<string, number>,
    endTime: number, depositTime: number, lockDuration: number, chainId: number) {
    super(tokens, pendingReward, rewardPerSec, chainId)
    this._lockDuration = lockDuration
    this._endTime = endTime
    this._depositTime = depositTime
    this._calculatedReward = calculatedReward
  }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
      "chain": getChainName(this.chainId),
      "tokens": Object.fromEntries(this.tokens.entries()),
      "pendingReward": Object.fromEntries(this.pendingReward.entries()),
      "rewardPerSec": this.rewardPerSec,
      "lockDuration": this._lockDuration,
      "endTime": this._endTime,
      "depositTime": this._depositTime,
      "calculatedReward": Object.fromEntries(this._calculatedReward)
    }))
  }
}
