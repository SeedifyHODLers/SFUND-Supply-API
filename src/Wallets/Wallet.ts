import Web3 from "web3";
import { ApeFarmingPool } from "../Pools/ApeFarmingPool";
import { ApeStakingPool } from "../Pools/ApeStakingPool";
import { FarmInfos } from "../Pools/FarmInfos";
import { StakingInfos } from "../Pools/StakingInfos";
import { TosDisStakingPool } from "../Pools/StakingPool";
import { Token } from "./Token";

type Pool = TosDisStakingPool | ApeStakingPool | ApeFarmingPool;

export class Wallet {

  private _total = new Map<string, number>()
  private _poolInfos: (StakingInfos | FarmInfos)[] = []
  private _rewardTokens = new Map<string, Token>()
  private _allPools: Pool[] = []
  private _farmTotal = new Map<string, number>()
  private _inWallet = new Map<string, number>();
  private _stakingTotal = new Map<string, number>();
  private _total_eligible: number = 0;

  constructor(private _web3: Web3, private _walletAddress: string, private _poolsAddress: string[], private _apeStakingAddress?: string, private _apeFarmingAddress?: string) {
  }

  public initPools = async (): Promise<void> => {
    const works: Promise<any>[] = this._poolsAddress.map(async (poolAddress) => {
      const stakingPool = new TosDisStakingPool(this._web3, poolAddress, this._walletAddress)
      return stakingPool.init().then(() => this._allPools.push(stakingPool))
    })
    if (undefined !== this._apeStakingAddress) {
      const apeStakingPool = new ApeStakingPool(this._web3, this._apeStakingAddress)
      await apeStakingPool.init()
      works.push(apeStakingPool.fetchInfos(this._walletAddress).then(() => this._allPools.push(apeStakingPool)))
    }
    if (undefined !== this._apeFarmingAddress) {
      const apeFarmingPool = new ApeFarmingPool(this._web3, this._apeFarmingAddress)
      await apeFarmingPool.init()
      works.push(apeFarmingPool.fetchInfos(this._walletAddress).then(() => this._allPools.push(apeFarmingPool)))
    }
    await Promise.all(works)
  }

  fetchInfos = async (): Promise<void> => {
    this._allPools.forEach((pool: Pool) => {
      const poolInfos = pool.infos
      pool.stackedAmount.forEach((amount: number, symbol: string) => {
        this._total.set(symbol, (this._total.get(symbol) || 0) + amount)
        if (symbol.toLowerCase() == 'sfund') {
          this._total_eligible += amount
        }
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
      this._total_eligible += amount
    }))
  }
}