import { PoolInfos } from "./PoolInfos"
import {getChainName} from "../utils";

export class FarmInfos extends PoolInfos {
  private _symbol: string
  private _lp: number
  private _totalSupply: number

  constructor(tokens: Map<string, number>, pendingReward: Map<string, number>, rewardPerSec: number,
    symbol: string, lp: number, totalSupply: number, chainId: number) {
    super(tokens, pendingReward, rewardPerSec, chainId)
    this._symbol = symbol
    this._lp = lp
    this._totalSupply = totalSupply
  }

  public get totalSupply(): number {
    return this._totalSupply
  }

  public get symbol(): string {
    return this._symbol
  }


  public get lp(): number {
    return this._lp
  }

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
      "chain": getChainName(this.chainId),
      "symbol": this._symbol,
      "lp": this._lp,
      "tokens": Object.fromEntries(this.tokens.entries()),
      "pendingReward": Object.fromEntries(this.pendingReward.entries()),
      "totalSupply": this._totalSupply,
      "rewardPerSec": this.rewardPerSec
    }))
  }
}
