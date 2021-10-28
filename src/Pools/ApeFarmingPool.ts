import Web3 from "web3"
import { ApeFarmingContract } from "../Contracts/ApeFarmingContract"
import { PoolContract } from "../Contracts/PoolContract"
import { PoolInfo } from "../Interfaces/PoolInfo"
import { UserInfo } from "../Interfaces/UserInfo"
import { LPToken } from "../Wallets/LPToken"
import { Token } from "../Wallets/Token"
import { TokenManager } from "../Wallets/TokenManager"
import { FarmInfos } from "./FarmInfos"

export class ApeFarmingPool extends ApeFarmingContract implements PoolContract {
  private _userInfo!: UserInfo
  private _allStakedAmount!: number
  private _rewardToken!: Token
  private _isFarming!: boolean
  private _stakingToken!: LPToken
  private _rewardPerSec!: number
  private _poolInfo!: PoolInfo
  private _pendingAmount!: number
  private _isLocked: boolean

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress)
    this._isFarming = true
    this._isLocked = false
  }

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    const rewardTokenAddress = await this.getRewardToken()
    this._poolInfo = await this.getPoolInfo()
    const rewardToken = TokenManager.getToken(rewardTokenAddress)
    if (rewardToken === undefined) {
      this._rewardToken = new Token(this.web3, rewardTokenAddress)
      works.push(this._rewardToken.init().then(() => TokenManager.addToken(this._rewardToken)))
    }
    else {
      this._rewardToken = rewardToken
    }
    const stakingToken = TokenManager.getLPToken(this._poolInfo.lpToken)
    if (stakingToken === undefined) {
      this._stakingToken = new LPToken(this.web3, this._poolInfo.lpToken)
      works.push(this._stakingToken.init().then(() => TokenManager.addLPToken(this._stakingToken)))
    } else {
      this._stakingToken = stakingToken
    }
    await Promise.all(works)
  }

  async fetchInfos(walletAddress: string) {
    const works: Promise<any>[] = []
    const totalAllocPoint = await this.getTotalAllocPoint()
    this._poolInfo = await this.getPoolInfo()
    works.push(this.getRewardPerBlock().then((rewardPerBloc) => this._rewardPerSec = (rewardPerBloc / 3 / totalAllocPoint) * this._poolInfo.allocPoint))
    works.push(this.getPendingReward(walletAddress).then((amount) => this._pendingAmount = amount))
    works.push(this.getUserInfo(walletAddress).then((userInfo) => this._userInfo = userInfo))
    works.push(this._stakingToken.getBalanceOf(this.contractAddress).then((allStakedAmount) => this._allStakedAmount = allStakedAmount))
    await Promise.all(works)
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