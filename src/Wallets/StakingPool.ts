import Web3 from "web3";
import { StakingPoolContract } from "../Contracts/StakingPoolContract";
import { FarmInfos } from "./FarmInfos";
import { LPToken } from "./LPToken";
import { StakingInfos } from "./StakingInfos";
import { Token } from "./Token";
import { TokenManager } from "./TokenManager";

export class StakingPool extends StakingPoolContract {
  private _stackedAmount!: number;
  private _pendingAmount!: number;
  private _rewardToken!: Token;
  private _stakingToken!: Token | LPToken;
  private _walletAddress: string;
  private _isFarming: boolean = false;
  private _allStakedAmount!: number;
  private _rewardPerSec!: number;
  private _startTime!: number;
  private _finishTime!: number;

  constructor(web3: Web3, contractAddress: string, walletAddress: string) {
    super(web3, contractAddress)
    this._walletAddress = walletAddress;
  }

  public async init(): Promise<void> {
    const works: Promise<void | number>[] = []
    works.push(this.getAllStakedAmount().then((allStakedAmount) => this._allStakedAmount = allStakedAmount))
    works.push(this.getRewardPerSec().then((rewardPerSec) => this._rewardPerSec = rewardPerSec))
    works.push(this.getStartTime().then((startTime) => this._startTime = startTime))
    works.push(this.getFinishTime().then((finishTime) => this._finishTime = finishTime))
    works.push(this.getUserInfo(this._walletAddress).then(userInfo => this._stackedAmount = userInfo))
    works.push(this.getPendingReward(this._walletAddress).then(pendingAmount => this._pendingAmount = pendingAmount))
    const rewardTokenAddress = await this.getRewardToken();
    const stakingTokenAddress = await this.getStakingToken();
    const rewardToken = TokenManager.getToken(rewardTokenAddress)
    if (rewardToken === undefined) {
      this._rewardToken = new Token(this.web3, rewardTokenAddress);
      works.push(this._rewardToken.init().then(() => TokenManager.addToken(this._rewardToken)))
    }
    else {
      this._rewardToken = rewardToken
    }

    if (stakingTokenAddress != rewardTokenAddress) {
      // Farming
      this._isFarming = true
      const stakingToken = TokenManager.getLPToken(stakingTokenAddress)
      if (stakingToken === undefined) {
        this._stakingToken = new LPToken(this.web3, stakingTokenAddress)
        works.push(this._stakingToken.init())
      } else {
        this._stakingToken = stakingToken
      }
      await Promise.all(works)
    }
    else {
      // Staking
      await Promise.all(works)
      this._stakingToken = this._rewardToken
    }
  }

  public get isFarming(): boolean {
    return this._isFarming;
  }

  public get stackedAmount(): Map<string, number> {
    const result = new Map<string, number>()
    if (this._stakingToken instanceof LPToken) {
      const amountToken0 = ((this._stakingToken.getToken0Amount() / this._stakingToken.totalSupply) * this._stackedAmount) / this._stakingToken.token0.decimals
      result.set(this._stakingToken.token0.symbol, amountToken0)
      const amountToken1 = ((this._stakingToken.getToken1Amount() / this._stakingToken.totalSupply) * this._stackedAmount) / this._stakingToken.token1.decimals
      result.set(this._stakingToken.token1.symbol, amountToken1)
    }
    else {
      result.set(this._stakingToken.symbol, this._stackedAmount / this._stakingToken.decimals)
    }
    return result;
  }

  public get pendingAmount(): Map<string, number> {
    const result = new Map<string, number>()
    result.set(this._rewardToken.symbol, this._pendingAmount / this._rewardToken.decimals)
    return result
  }

  public get rewardToken(): Token {
    return this._rewardToken
  }

  public get infos(): FarmInfos | StakingInfos {
    const rewardPerSec = (this._rewardPerSec * (this._stackedAmount / this._allStakedAmount)) / this._rewardToken.decimals
    const poolDuration = this._finishTime - this._startTime
    if (this._stakingToken instanceof LPToken) {
      return new FarmInfos(this.stackedAmount, this.pendingAmount, rewardPerSec, poolDuration, this._stakingToken.symbol, this._stackedAmount / this._stakingToken.decimals, this._allStakedAmount)
    }
    return new StakingInfos(this.stackedAmount, this.pendingAmount, rewardPerSec, poolDuration)
  }

  public get rewardPerSec(): number {
    return this._rewardPerSec
  }

  public get allStacedAmount(): number {
    return this._allStakedAmount
  }

  public get startTime(): number {
    return this._startTime
  }

  public get finishTime(): number {
    return this._finishTime
  }
}