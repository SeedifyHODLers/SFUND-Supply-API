import Web3 from "web3"
import { SeedifyLockedStakingContract } from "../Contracts/SeedifyLockedStakingContract"
import { DataFetcher } from "../Interfaces/DataFetcher"
import { StakingUserDeposit } from "../Interfaces/StakingUserDeposit"
import { Token } from "../Wallets/Token"
import { LockedStakingInfos } from "./LockedStakingInfos"

export class SeedifyLockedStakingDataFetcher extends SeedifyLockedStakingContract implements DataFetcher {

  private _isFarming: boolean
  private _calculatedReward: number = 0
  private _userDeposit: StakingUserDeposit = {
    depositAmount: 0,
    depositTime: 0,
    endTime: 0,
    userIndex: 0,
    rewards: 0,
    paid: false
  }
  private _stakedTotal!: number
  private _rewardPerSec!: number
  private _isLocked: boolean

  constructor(web3: Web3, contractAddress: string, private _token: Token, private _lockDuration: number) {
    super(web3, contractAddress)
    this._isFarming = false
    this._isLocked = true
  }

  async fetchInfos(walletAddress: string) {
    const works: Promise<any>[] = []
    works.push(this.stakedTotal().then(amount => this._stakedTotal = amount))
    works.push(this.getUserDeposits(walletAddress).then(userDeposit => this._userDeposit = userDeposit))
    works.push(this.calculate(walletAddress).then(amount => this._calculatedReward = amount))
    await Promise.all(works)
    this._rewardPerSec = this._calculatedReward / this._lockDuration / this._token.decimals
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
      const pendingReward = (this._userDeposit.rewards / this._token.decimals) + ((this._calculatedReward * ((now - this._userDeposit.depositTime) / this._lockDuration)) / this._token.decimals)
      return result.set(this._token.symbol, pendingReward)
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