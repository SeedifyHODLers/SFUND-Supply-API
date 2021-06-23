import Web3 from "web3";
import { FarmInfos } from "./FarmInfos";
import { StakingInfos } from "./StakingInfos";
import { StakingPool } from "./StakingPool";
import { Token } from "./Token";

export class Wallet {

  private _total = new Map<string, number>()
  private _poolInfos: (StakingInfos | FarmInfos)[] = []
  private _rewardTokens = new Map<string, Token>()
  private _allPools: StakingPool[] = []
  private _farmTotal = new Map<string, number>()
  private _inWallet = new Map<string, number>();
  private _stakingTotal = new Map<string, number>();

  constructor(private _web3: Web3, private _poolsAddress: string[], private _walletAddress: string) { }

  fetchInfos = async (): Promise<void> => {
    await this.initPools()
    this._allPools.forEach((pool: StakingPool) => {
      const poolInfos = pool.infos
      pool.stackedAmount.forEach((amount: number, symbol: string) => {
        this._total.set(symbol, (this._total.get(symbol) || 0) + amount)
        if (poolInfos instanceof FarmInfos) {
          this._farmTotal.set(symbol, (this._farmTotal.get(symbol) || 0) + amount)
        }
        else {
          this._stakingTotal.set(symbol, (this._stakingTotal.get(symbol) || 0) + amount)
        }
      })
      pool.pendingAmount.forEach((amount: number, symbol: string) => {
        this._total.set(symbol, (this._total.get(symbol) || 0) + amount)
        if (poolInfos instanceof FarmInfos) {
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

  private initPools = async (): Promise<void> => {
    await Promise.all(this._poolsAddress.map(async (poolAddress) => {
      const stakingPool = new StakingPool(this._web3, poolAddress, this._walletAddress)
      return stakingPool.init().then(() => this._allPools.push(stakingPool))
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