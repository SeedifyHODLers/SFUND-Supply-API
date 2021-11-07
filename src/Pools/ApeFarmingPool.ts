import Web3 from "web3"
import { ApeFarmingContract } from "../Contracts/ApeFarmingContract"
import { PoolInfo } from "../Interfaces/PoolInfo"
import { LPToken } from "../Wallets/LPToken"
import { Token } from "../Wallets/Token"
import { TokenManager } from "../Wallets/TokenManager"
import { ApeFarmingDataFetcher } from "./ApeFarmingDataFetcher"

export class ApeFarmingPool extends ApeFarmingContract {
  private _rewardToken!: Token
  private _stakingToken!: LPToken
  private _poolInfo!: PoolInfo

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

  getDataFetcher(web3: Web3): ApeFarmingDataFetcher {
    return new ApeFarmingDataFetcher(web3, this.contractAddress, this._stakingToken, this._rewardToken, this._poolInfo)
  }

}