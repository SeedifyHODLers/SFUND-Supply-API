import Web3 from "web3"
import { ApeStakingContract } from "../Contracts/ApeStakingContract"
import { PoolContract } from "../Contracts/PoolContract"
import { UserInfo } from "../Interfaces/UserInfo"
import { Token } from "../Wallets/Token"
import { TokenManager } from "../Wallets/TokenManager"
import { StakingInfos } from "./StakingInfos"

export class ApeStakingPool extends ApeStakingContract implements PoolContract {
  private _userInfo!: UserInfo
  private _allStakedAmount!: number
  private _rewardToken!: Token
  private _isFarming: boolean
  private _stakingToken!: Token
  private _rewardPerSec!: number
  private _pendingAmount!: number
  private _isLocked: boolean

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress)
    this._isFarming = false
    this._isLocked = false
  }

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    if (await this.web3.eth.net.isListening()) {
      const stakingTokenAddress = await this.getStakingToken()
      const rewardTokenAddress = await this.getRewardToken()
      const rewardToken = TokenManager.getToken(rewardTokenAddress)
      if (rewardToken === undefined) {
        this._rewardToken = new Token(this.web3, rewardTokenAddress)
        works.push(this._rewardToken.init().then(() => TokenManager.addToken(this._rewardToken)))
      }
      else {
        this._rewardToken = rewardToken
      }
      const stakingToken = TokenManager.getToken(stakingTokenAddress)
      if (stakingToken === undefined) {
        this._stakingToken = new Token(this.web3, stakingTokenAddress)
        works.push(this._stakingToken.init().then(() => TokenManager.addToken(this._stakingToken)))
      } else {
        this._stakingToken = stakingToken
      }
      await Promise.all(works)
    }
  }

  async fetchInfos(walletAddress: string) {
    if (await this.web3.eth.net.isListening()) {
      const works: Promise<any>[] = []
      works.push(this.getRewardPerBlock().then((rewardPerBloc) => this._rewardPerSec = rewardPerBloc / 3))
      works.push(this.getAllStakedAmount().then((allStakedAmount) => this._allStakedAmount = allStakedAmount))
      works.push(this.getPendingReward(walletAddress).then((amount) => this._pendingAmount = amount))
      works.push(this.getUserInfo(walletAddress).then((userInfo) => this._userInfo = userInfo))
      await Promise.all(works)
    }
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