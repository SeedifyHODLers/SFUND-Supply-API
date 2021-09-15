import Web3 from "web3"
import { ApeStakingContract } from "../Contracts/ApeStakingContract"
import { UserInfo } from "../Interfaces/UserInfo"
import { Token } from "../Wallets/Token"
import { TokenManager } from "../Wallets/TokenManager"
import { StakingInfos } from "./StakingInfos"

export class ApeStakingPool extends ApeStakingContract {
  private _userInfo!: UserInfo
  private _allStakedAmount!: number
  private _rewardToken!: Token
  private _isFarming!: boolean
  private _stakingToken!: Token
  private _rewardPerSec!: number
  private _pendingAmount!: number

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress)
    this._isFarming = false
  }

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    const stakingTokenAddress = await this.getStakingToken()
    const rewardTokenAddress = await this.getRewardToken()
    works.push(this.getRewardPerBlock().then((rewardPerBloc) => this._rewardPerSec = rewardPerBloc / 3))
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
    works.push(this.getAllStakedAmount().then((allStakedAmount) => this._allStakedAmount = allStakedAmount))
    await Promise.all(works)
  }

  public get infos(): StakingInfos {
    const rewardPerSec = (this._rewardPerSec * (this._userInfo.amount / this._allStakedAmount)) / this._rewardToken.decimals
    return new StakingInfos(this.stackedAmount, this.pendingAmount, rewardPerSec, 0)
  }

  public get rewardToken(): Token {
    return this._rewardToken
  }

  public get isFarming(): boolean {
    return this._isFarming;
  }

  public get stackedAmount(): Map<string, number> {
    const result = new Map<string, number>()
    result.set(this._stakingToken.symbol, this._userInfo.amount / this._stakingToken.decimals)
    return result;
  }

  public get pendingAmount(): Map<string, number> {
    const result = new Map<string, number>()
    result.set(this._rewardToken.symbol, this._pendingAmount / this._rewardToken.decimals)
    return result
  }


}