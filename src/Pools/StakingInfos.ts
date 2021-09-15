export class StakingInfos {
  constructor(private _tokens: Map<string, number>, private _pendingReward: Map<string, number>, private _rewardPerSec: number, private _poolDuration: number) { }

  public get tokens(): Map<string, number> {
    return this._tokens
  }

  public get pendingReward(): Map<string, number> {
    return this._pendingReward
  }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
      "tokens": Object.fromEntries(this._tokens.entries()),
      "pendingReward": Object.fromEntries(this._pendingReward.entries()),
      "rewardPerSec": this._rewardPerSec,
      "duration": this._poolDuration
    }))
  }
}