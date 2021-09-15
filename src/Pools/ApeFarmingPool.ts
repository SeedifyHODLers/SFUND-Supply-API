import Web3 from "web3";
import { ApeFarmingContract } from "../Contracts/ApeFarmingContract";
import { PoolInfo } from "../Interfaces/PoolInfo";
import { UserInfo } from "../Interfaces/UserInfo";
import { LPToken } from "../Wallets/LPToken";
import { Token } from "../Wallets/Token";
import { TokenManager } from "../Wallets/TokenManager";
import { FarmInfos } from "./FarmInfos";

export class ApeFarmingPool extends ApeFarmingContract {
  private _userInfo!: UserInfo
  private _allStakedAmount!: number
  private _rewardToken!: Token
  private _isFarming!: boolean
  private _stakingToken!: LPToken
  private _rewardPerSec!: number
  private _poolInfo!: PoolInfo;
  private _pendingAmount!: number;

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress)
    this._isFarming = true
  }

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    const rewardTokenAddress = await this.getRewardToken()
    this._poolInfo = await this.getPoolInfo()
    const totalAllocPoint = await this.getTotalAllocPoint()
    works.push(this.getRewardPerBlock().then((rewardPerBloc) => this._rewardPerSec = (rewardPerBloc / 3 / totalAllocPoint) * this._poolInfo.allocPoint))
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
      works.push(this._stakingToken.init())
    } else {
      this._stakingToken = stakingToken
    }
    await Promise.all(works)
  }

  async fetchInfos(walletAddress: string) {
    const works: Promise<any>[] = []
    works.push(this.getPendingReward(walletAddress).then((amount) => this._pendingAmount = amount))
    works.push(this.getUserInfo(walletAddress).then((userInfo) => this._userInfo = userInfo))
    works.push(this._stakingToken.getBalanceOf(this.contractAddress).then((allStakedAmount) => this._allStakedAmount = allStakedAmount))
    await Promise.all(works)
  }

  public get infos(): FarmInfos {
    const rewardPerSec = (this._rewardPerSec * (this._userInfo.amount / this._allStakedAmount)) / this._rewardToken.decimals
    return new FarmInfos(this.stackedAmount, this.pendingAmount, rewardPerSec, 0, this._stakingToken.symbol, this._userInfo.amount / this._stakingToken.decimals, this._allStakedAmount / this._stakingToken.decimals)
  }

  public get rewardToken(): Token {
    return this._rewardToken
  }

  public get isFarming(): boolean {
    return this._isFarming;
  }

  public get stackedAmount(): Map<string, number> {
    const result = new Map<string, number>()
    const amountToken0 = ((this._stakingToken.getToken0Amount() / this._stakingToken.totalSupply) * this._userInfo.amount) / this._stakingToken.token0.decimals
    result.set(this._stakingToken.token0.symbol, amountToken0)
    const amountToken1 = ((this._stakingToken.getToken1Amount() / this._stakingToken.totalSupply) * this._userInfo.amount) / this._stakingToken.token1.decimals
    result.set(this._stakingToken.token1.symbol, amountToken1)
    return result;
  }

  public get pendingAmount(): Map<string, number> {
    const result = new Map<string, number>()
    result.set(this._rewardToken.symbol, this._pendingAmount / this._rewardToken.decimals)
    return result
  }
}