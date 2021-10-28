import Web3 from "web3"
import { PoolContract } from "../Contracts/PoolContract"
import { SeedifyLockedFarmingContract } from "../Contracts/SeedifyLockedFarmingContract"
import { FarmUserDeposit } from "../Interfaces/FarmUserDeposit"
import { LPToken } from "../Wallets/LPToken"
import { Token } from "../Wallets/Token"
import { TokenManager } from "../Wallets/TokenManager"
import { LockedFarmingInfos } from "./LockedFarmingInfos"

export class SeedifyLockedFarmingPool extends SeedifyLockedFarmingContract implements PoolContract {

  private _isFarming: boolean
  private _lockDuration!: number
  private _rewardToken!: Token
  private _stakingToken!: LPToken
  private _calculatedReward!: number
  private _userDeposit!: FarmUserDeposit
  private _stakedTotal!: number
  private _rewardPerSec!: number
  private _isLocked: boolean

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress)
    this._isFarming = true
    this._isLocked = true
  }

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    const rewardTokenAddress = await this.rewardTokenAddress()
    this._lockDuration = (await this.lockDuration()) * 60 * 60
    const rewardToken = TokenManager.getToken(rewardTokenAddress)
    if (rewardToken === undefined) {
      this._rewardToken = new Token(this.web3, rewardTokenAddress)
      works.push(this._rewardToken.init().then(() => TokenManager.addToken(this._rewardToken)))
    }
    else {
      this._rewardToken = rewardToken
    }
    const stakingTokenAddress = await this.stakingTokenAddress()
    const stakingToken = TokenManager.getLPToken(stakingTokenAddress)
    if (stakingToken === undefined) {
      this._stakingToken = new LPToken(this.web3, stakingTokenAddress)
      works.push(this._stakingToken.init().then(() => TokenManager.addLPToken(this._stakingToken)))
    } else {
      this._stakingToken = stakingToken
    }
    await Promise.all(works)
  }

  async fetchInfos(walletAddress: string) {
    const works: Promise<any>[] = []
    works.push(this.blocksPerHour())
    works.push(this.rewPerBlock())
    works.push(this.stakedTotal().then((amount: number) => this._stakedTotal = amount))
    works.push(this.calculate(walletAddress).then((amount: number) => this._calculatedReward = amount))
    works.push(this.getUserDeposits(walletAddress).then((userDeposit: FarmUserDeposit) => this._userDeposit = userDeposit))
    await Promise.all(works).then(results => this._rewardPerSec = (results[0] / 60 / 60) * results[1])
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