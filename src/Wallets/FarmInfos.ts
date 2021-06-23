export class FarmInfos {
  constructor(private _tokens: Map<string, number>, private _pendingReward: Map<string, number>, private _rewardPerSec: number, private _poolDuration: number, private _symbol: string, private _lp: number) { }

  public get tokens(): Map<string, number> {
    return this._tokens
  }

  public get pendingReward(): Map<string, number> {
    return this._pendingReward
  }

  public get symbol(): string {
    return this._symbol
  }

  public get lp(): number {
    return this._lp
  }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
      "symbol": this._symbol,
      "lp": this._lp,
      "tokens": Object.fromEntries(this._tokens.entries()),
      "pendingReward": Object.fromEntries(this._pendingReward.entries()),
      "rewardPerSec": this._rewardPerSec,
      "duration": this._poolDuration
    }))
  }
}