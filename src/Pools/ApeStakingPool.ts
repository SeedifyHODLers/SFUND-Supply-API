import Web3 from "web3"
import { ApeStakingContract } from "../Contracts/ApeStakingContract"
import { Token } from "../Wallets/Token"
import { TokenManager } from "../Wallets/TokenManager"
import { ApeStakingDataFetcher } from "./ApeStakingApeDataFetcher"

export class ApeStakingPool extends ApeStakingContract {
  private _rewardToken!: Token
  private _stakingToken!: Token

  async init(): Promise<void> {
    const works: Promise<any>[] = []
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

  getDataFetcher(web3: Web3): ApeStakingDataFetcher {
    return new ApeStakingDataFetcher(web3, this.contractAddress, this._stakingToken, this._rewardToken)
  }
}