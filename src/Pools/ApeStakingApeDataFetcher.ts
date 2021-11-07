import Web3 from "web3"
import { ApeStakingContract } from "../Contracts/ApeStakingContract"
import { DataFetcher } from "../Interfaces/DataFetcher"
import { UserInfo } from "../Interfaces/UserInfo"
import { Token } from "../Wallets/Token"
import { StakingInfos } from "./StakingInfos"

export class ApeStakingDataFetcher extends ApeStakingContract implements DataFetcher {
  private _userInfo!: UserInfo
  private _allStakedAmount!: number
  private _isFarming: boolean
  private _rewardPerSec!: number
  private _pendingAmount!: number
  private _isLocked: boolean

  constructor(web3: Web3, contractAddress: string, private _stakingToken: Token, private _rewardToken: Token) {
    super(web3, contractAddress)
    this._isFarming = false
    this._isLocked = false
  }

  async fetchInfos(walletAddress: string) {
    const works: Promise<any>[] = []
    works.push(this.getRewardPerBlock().then((rewardPerBloc) => this._rewardPerSec = rewardPerBloc / 3))
    works.push(this.getAllStakedAmount().then((allStakedAmount) => this._allStakedAmount = allStakedAmount))
    works.push(this.getPendingReward(walletAddress).then((amount) => this._pendingAmount = amount))
    works.push(this.getUserInfo(walletAddress).then((userInfo) =>
      this._userInfo = userInfo
    ))
    await Promise.all(works)
  }

  public get infos(): StakingInfos {
    const rewardPerSec = (this._rewardPerSec * (this._userInfo.amount / this._allStakedAmount)) / this._rewardToken.decimals
    return new StakingInfos(this.stakedAmount, this.pendingAmount, rewardPerSec)
  }

  public get rewardToken(): Token {
    return this._rewardToken
  }

  public get isLocked(): boolean {
    return this._isLocked
  }

  public get isFarming(): boolean {
    return this._isFarming
  }

  public get rewardPerSec(): number {
    return this._rewardPerSec
  }

  public get stakedToken(): Token {
    return this._stakingToken
  }

  public get allStakedAmount(): number {
    return this._allStakedAmount
  }

  public get stakedAmount(): Map<string, number> {
    const result = new Map<string, number>()
    result.set(this._stakingToken.symbol, this._userInfo.amount / this._stakingToken.decimals)
    return result;
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
      rewardToken: this.rewardToken.symbol,
      stakedToken: this.stakedToken.symbol
    }))
  }

}