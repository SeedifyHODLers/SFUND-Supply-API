import Web3 from "web3"
import { ApeFarmingContract } from "../Contracts/ApeFarmingContract"
import { DataFetcher } from "../Interfaces/DataFetcher"
import { PoolInfo } from "../Interfaces/PoolInfo"
import { UserInfo } from "../Interfaces/UserInfo"
import { LPToken } from "../Wallets/LPToken"
import { Token } from "../Wallets/Token"
import { FarmInfos } from "./FarmInfos"

export class ApeFarmingDataFetcher extends ApeFarmingContract implements DataFetcher {
  private _userInfo!: UserInfo
  private _allStakedAmount!: number
  private _rewardPerSec!: number
  private _pendingAmount!: number
  private _isFarming: boolean = true
  private _isLocked: boolean = false

  constructor(web3: Web3, contractAddress: string, private _stakingToken: LPToken, private _rewardToken: Token, private _poolInfo: PoolInfo) {
    super(web3, contractAddress)
  }

  async fetchInfos(walletAddress: string): Promise<void> {
    const works: Promise<any>[] = []
    let totalAllocPoint = 0
    let rewardPerBlock = 0
    works.push(this.getTotalAllocPoint().then(amount => totalAllocPoint = amount))
    works.push(this.getPoolInfo().then(info => this._poolInfo = info))
    works.push(this.getRewardPerBlock().then(amount => rewardPerBlock = amount))
    works.push(this.getPendingReward(walletAddress).then(amount => this._pendingAmount = amount))
    works.push(this.getUserInfo(walletAddress).then(info =>
      this._userInfo = info))

    works.push(this._stakingToken.getBalanceOf(this.contractAddress).then(amount => this._allStakedAmount = amount))
    works.push(this._stakingToken.fetchInfos())
    await Promise.all(works)
    this._rewardPerSec = (rewardPerBlock / 3 / totalAllocPoint) * this._poolInfo.allocPoint
  }

  public get infos(): FarmInfos {
    const rewardPerSec = (this._rewardPerSec * (this._userInfo.amount / this._allStakedAmount)) / this._rewardToken.decimals
    return new FarmInfos(this.stakedAmount, this.pendingAmount, rewardPerSec, this._stakingToken.symbol, this._userInfo.amount / this._stakingToken.decimals, this._allStakedAmount / this._stakingToken.decimals)
  }

  public get rewardToken(): Token {
    return this._rewardToken
  }

  public get stakedToken(): LPToken {
    return this._stakingToken
  }

  public get isFarming(): boolean {
    return this._isFarming
  }

  public get isLocked(): boolean {
    return this._isLocked
  }

  public get rewardPerSec(): number {
    return this._rewardPerSec
  }

  public get allStakedAmount(): number {
    return this._allStakedAmount
  }

  public get stakedAmount(): Map<string, number> {
    const result = new Map<string, number>()
    const amountToken0 = ((this._stakingToken.getToken0Amount() / this._stakingToken.totalSupply) * this._userInfo.amount) / this._stakingToken.token0.decimals
    result.set(this._stakingToken.token0.symbol, amountToken0)
    const amountToken1 = ((this._stakingToken.getToken1Amount() / this._stakingToken.totalSupply) * this._userInfo.amount) / this._stakingToken.token1.decimals
    result.set(this._stakingToken.token1.symbol, amountToken1)
    return result
  }

  public get pendingAmount(): Map<string, number> {
    const result = new Map<string, number>()
    result.set(this._rewardToken.symbol, this._pendingAmount / this._rewardToken.decimals)
    return result
  }

  public toJSON(): JSON {
    return JSON.parse(JSON.stringify({
      totalStaked: this.allStakedAmount,
      rewardPerSec: this.rewardPerSec,
      rewardToken: { symbol: this.rewardToken.symbol },
      stakedToken: {
        symbol: this.stakedToken.symbol,
        token0: this.stakedToken.token0.symbol,
        token1: this.stakedToken.token1.symbol
      }
    }))
  }
}