import { PoolContract } from "../Contracts/PoolContract";
import { FarmInfos } from "../Pools/FarmInfos";
import { LockedFarmingInfos } from "../Pools/LockedFarmingInfos";
import { PoolInfos } from "../Pools/PoolInfos";
import { PoolManager } from "../Pools/PoolManager";
import { StakingInfos } from "../Pools/StakingInfos";
import { Token } from "./Token";

export class Wallet {

  private _total = new Map<string, number>()
  private _poolInfos: PoolInfos[] = []
  private _rewardTokens = new Map<string, Token>()
  private _farmTotal = new Map<string, number>()
  private _inWallet = new Map<string, number>();
  private _stakingTotal = new Map<string, number>();
  private _total_eligible: number = 0;

  constructor(private _walletAddress: string) {
  }

  public initPools = async (): Promise<void> => {
    await Promise.all(PoolManager.getAll().map(contract => contract.fetchInfos(this._walletAddress)))
  }

  fetchInfos = async (): Promise<void> => {
    PoolManager.getAll().forEach((pool: PoolContract) => {
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
      this._poolInfos.push(pool.infos);
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

  private getInWallet = async (): Promise<void> => {
    await Promise.all(Array.from(this._rewardTokens, async ([symbol, token]) => {
      const amount = (await token.getBalanceOf(this._walletAddress)) / token.decimals
      this._inWallet.set(symbol, (this._inWallet.get(symbol) || 0) + amount)
      this._total.set(symbol, (this._total.get(symbol) || 0) + amount)
    }))
  }
}