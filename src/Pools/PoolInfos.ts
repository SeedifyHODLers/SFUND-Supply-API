export abstract class PoolInfos {

  constructor(private _tokens: Map<string, number>, private _pendingReward: Map<string, number>, private _rewardPerSec: number, private _chainId: number) { }

  public get tokens(): Map<string, number> {
    return this._tokens
  }

  public get chainId(): number {
    return this._chainId
  }

  public get pendingReward(): Map<string, number> {
    return this._pendingReward
  }

  public get rewardPerSec(): number {
    return this._rewardPerSec
  }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify(this))
  }
}
