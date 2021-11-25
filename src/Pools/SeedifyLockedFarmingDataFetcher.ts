import Web3 from "web3"
import { SeedifyLockedFarmingContract } from "../Contracts/SeedifyLockedFarmingContract"
import { DataFetcher } from "../Interfaces/DataFetcher"
import { FarmUserDeposit } from "../Interfaces/FarmUserDeposit"
import { LPToken } from "../Wallets/LPToken"
import { Token } from "../Wallets/Token"
import { LockedFarmingInfos } from "./LockedFarmingInfos"

export class SeedifyLockedFarmingDataFetcher extends SeedifyLockedFarmingContract implements DataFetcher {

  private _isFarming: boolean
  private _calculatedReward: number = 0
  private _userDeposit: FarmUserDeposit = {
    amount: 0,
    initialStake: 0,
    latestClaim: 0,
    currentPeriod: 0
  }
  private _stakedTotal!: number
  private _rewardPerSec!: number
  private _isLocked: boolean

  constructor(web3: Web3, contractAddress: string, private _stakingToken: LPToken, private _rewardToken: Token, private _lockDuration: number) {
    super(web3, contractAddress)
    this._isFarming = true
    this._isLocked = true
  }

  async fetchInfos(walletAddress: string): Promise<void> {
    let blocksPerHour = 0
    let rewPerBlock = 0
    const works: Promise<number | FarmUserDeposit | void>[] = []
    works.push(this.getUserDeposits(walletAddress).then((userDeposit) =>
      this._userDeposit = userDeposit))
    works.push(this.blocksPerHour().then((bph) => blocksPerHour = bph))
    works.push(this.rewPerBlock().then((rpb) => rewPerBlock = rpb))
    works.push(this.stakedTotal().then((stakedTotal) => this._stakedTotal = stakedTotal))
    works.push(this._stakingToken.fetchInfos())
    works.push(this.calculate(walletAddress).then(amount => this._calculatedReward = amount))
    await Promise.all(works)
    this._rewardPerSec = (blocksPerHour / 60 / 60) * rewPerBlock
  }

  public get infos(): LockedFarmingInfos {
    const rewardPerSec = (this._rewardPerSec * (this._userDeposit.amount / this.allStakedAmount)) / this._rewardToken.decimals
    return new LockedFarmingInfos(this.stakedAmount, this.pendingAmount, rewardPerSec, this._stakingToken.symbol,
      this._userDeposit.amount / this._stakingToken.decimals, this.allStakedAmount / this._rewardToken.decimals, this._userDeposit.initialStake, this._lockDuration)
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

  public get allStakedAmount(): number {
    return this._stakedTotal
  }

  public get rewardPerSec(): number {
    return this._rewardPerSec
  }

  public get stakedAmount(): Map<string, number> {
    const result = new Map<string, number>()
    const amountToken0 = ((this._stakingToken.getToken0Amount() / this._stakingToken.totalSupply) * this._userDeposit.amount) / this._stakingToken.token0.decimals
    result.set(this._stakingToken.token0.symbol, amountToken0)
    const amountToken1 = ((this._stakingToken.getToken1Amount() / this._stakingToken.totalSupply) * this._userDeposit.amount) / this._stakingToken.token1.decimals
    result.set(this._stakingToken.token1.symbol, amountToken1)
    return result
  }

  public get pendingAmount(): Map<string, number> {
    const result = new Map<string, number>()
    result.set(this._rewardToken.symbol, this._calculatedReward / this._rewardToken.decimals)
    return result
  }

  public toJSON(): JSON {
    return JSON.parse(JSON.stringify({
      totalStaked: this.allStakedAmount,
      lockDuration: this._lockDuration,
      rewardPerSec: this.rewardPerSec,
      rewardToken: this.rewardToken.symbol,
      stakedToken: {
        symbol: this.stakedToken.symbol,
        token0: this.stakedToken.token0.symbol,
        token1: this.stakedToken.token1.symbol
      }
    }))
  }
}