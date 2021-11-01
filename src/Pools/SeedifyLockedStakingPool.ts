import Web3 from "web3"
import { PoolContract } from "../Contracts/PoolContract"
import { SeedifyLockedStakingContract } from "../Contracts/SeedifyLockedStakingContract"
import { StakingUserDeposit } from "../Interfaces/StakingUserDeposit"
import { Token } from "../Wallets/Token"
import { TokenManager } from "../Wallets/TokenManager"
import { LockedStakingInfos } from "./LockedStakingInfos"

export class SeedifyLockedStakingPool extends SeedifyLockedStakingContract implements PoolContract {

  private _isFarming: boolean
  private _lockDuration!: number
  private _token!: Token
  private _calculatedReward!: number
  private _userDeposit!: StakingUserDeposit
  private _stakedTotal!: number
  private _rewardPerSec!: number
  private _isLocked: boolean

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress)
    this._isFarming = false
    this._isLocked = true
  }

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    const tokenAddress = await this.tokenAddress()
    this._lockDuration = (await this.lockDuration()) * 60 * 60
    const rewardToken = TokenManager.getToken(tokenAddress)
    if (rewardToken === undefined) {
      this._token = new Token(this.web3, tokenAddress)
      works.push(this._token.init().then(() => TokenManager.addToken(this._token)))
    }
    else {
      this._token = rewardToken
    }
    await Promise.all(works)
  }

  async fetchInfos(walletAddress: string) {
    const works: Promise<any>[] = []
    works.push(this.stakedTotal().then((amount: number) => this._stakedTotal = amount))
    works.push(this.calculate(walletAddress).then((amount: number) => this._calculatedReward = amount))
    works.push(this.getUserDeposits(walletAddress).then((userDeposit: StakingUserDeposit) => this._userDeposit = userDeposit))
    await Promise.all(works)
    this._rewardPerSec = this._calculatedReward / (this._lockDuration) / this.stakedToken.decimals
  }

  public get infos(): LockedStakingInfos {
    return new LockedStakingInfos(this.stakedAmount, this.pendingAmount, this._rewardPerSec, this.calculatedReward, this._userDeposit.endTime, this._userDeposit.depositTime, this._lockDuration)
  }

  public get rewardToken(): Token {
    return this._token
  }

  public get stakedToken(): Token {
    return this._token
  }

  public get isFarming(): boolean {
    return this._isFarming
  }

  public get isLocked(): boolean {
    return this._isLocked
  }

  public get allStakedAmount(): number {
    return this._stakedTotal
  }

  public get rewardPerSec(): number {
    return this._rewardPerSec
  }

  public get stakedAmount(): Map<string, number> {
    const result = new Map<string, number>()
    return result.set(this._token.symbol, this._userDeposit.depositAmount / this._token.decimals)
  }

  public get pendingAmount(): Map<string, number> {
    const result = new Map<string, number>()
    // smart contract return timestamp in second
    const now = new Date().getTime() / 1000
    if (this._userDeposit.endTime > now) {
      const pendingReward = this._calculatedReward * ((now - this._userDeposit.depositTime) / this._lockDuration)
      return result.set(this._token.symbol, pendingReward / this._token.decimals)
    }
    return result.set(this._token.symbol, this._userDeposit.rewards / this._token.decimals)
  }

  public get calculatedReward(): Map<string, number> {
    const result = new Map<string, number>()
    return result.set(this._token.symbol, this._calculatedReward / this._token.decimals)
  }

  public toJSON(): JSON {
    return JSON.parse(JSON.stringify({
      totalStaked: this.allStakedAmount,
      rewardToken: this.rewardToken.symbol,
      stakedToken: this.stakedToken.symbol,
      lockDuration: this._lockDuration
    }))
  }
}