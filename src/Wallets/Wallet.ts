import { DataFetcher } from "../Interfaces/DataFetcher"
import { FarmInfos } from "../Pools/FarmInfos"
import { LockedFarmingInfos } from "../Pools/LockedFarmingInfos"
import { PoolInfos } from "../Pools/PoolInfos"
import { StakingInfos } from "../Pools/StakingInfos"
import { Token } from "./Token"

export class Wallet {

  private _total = new Map<string, number>()
  private _poolInfos: PoolInfos[] = []
  private _rewardTokens = new Map<string, Token>()
  private _farmTotal = new Map<string, number>()
  private _inWallet = new Map<string, number>()
  private _stakingTotal = new Map<string, number>()
  private _total_eligible: number = 0

  constructor(private _walletAddress: string, private _pools: DataFetcher[]) { }

  public initPools = async () => {
    await Promise.all(this._pools.map(async (pool, index) => {
      await pool.fetchInfos(this._walletAddress)
    }))
  }

  fetchInfos = async (): Promise<void> => {
    this._pools.forEach((pool: DataFetcher) => {
      const poolInfos = pool.infos
      pool.stakedAmount.forEach((amount: number, symbol: string) => {
        this._total.set(symbol, (this._total.get(symbol) || 0) + amount)
        if (pool.isLocked && symbol.toLowerCase() == 'sfund') {
          this._total_eligible += amount
        }
        if (poolInfos instanceof FarmInfos || poolInfos instanceof LockedFarmingInfos) {
          this._farmTotal.set(symbol, (this._farmTotal.get(symbol) || 0) + amount)
        }
        else {
          this._stakingTotal.set(symbol, (this._stakingTotal.get(symbol) || 0) + amount)
        }
      })
      pool.pendingAmount.forEach((amount: number, symbol: string) => {
        this._total.set(symbol, (this._total.get(symbol) || 0) + amount)
        if (poolInfos instanceof FarmInfos || poolInfos instanceof LockedFarmingInfos) {
          this._farmTotal.set(symbol, (this._farmTotal.get(symbol) || 0) + amount)
        }
        else {
          this._stakingTotal.set(symbol, (this._stakingTotal.get(symbol) || 0) + amount)
        }
      })
      this._rewardTokens.set(pool.rewardToken.symbol, pool.rewardToken)
      this._poolInfos.push(pool.infos)
    })
    await this.getInWallet()
  }

  public infosAsJson = (): JSON => {
    return JSON.parse(JSON.stringify({
      "total": Object.fromEntries(this._total.entries()),
      "eligible": this._total_eligible,
      "staking": {
        "total": Object.fromEntries(this._stakingTotal.entries()),
        "details": this._poolInfos.filter((poolInfo) => poolInfo instanceof StakingInfos)
          .map(stakingInfos => stakingInfos.asJSON())
      },
      "farming": {
        "total": Object.fromEntries(this._farmTotal.entries()),
        "details": this._poolInfos.filter((poolInfo) => poolInfo instanceof FarmInfos)
          .map(farmingInfos => farmingInfos.asJSON())
      },
      "wallet": Object.fromEntries(this._inWallet.entries())
    }))
  }

  private getInWallet = async () => {
    const works: Promise<void>[] = []
    for (const [symbol, token] of this._rewardTokens) {
      works.push(token.getBalanceOf(this._walletAddress).then(amount => {
        const realAmount = (amount / token.decimals) > 1e-6 ? (amount / token.decimals) : 0
        this._inWallet.set(symbol, (this._inWallet.get(symbol) || 0) + realAmount)
        this._total.set(symbol, (this._total.get(symbol) || 0) + realAmount)
      }))
    }
    await Promise.all(works)
  }
}