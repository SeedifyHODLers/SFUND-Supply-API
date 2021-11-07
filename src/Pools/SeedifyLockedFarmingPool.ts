import Web3 from "web3";
import { SeedifyLockedFarmingContract } from "../Contracts/SeedifyLockedFarmingContract";
import { LPToken } from "../Wallets/LPToken";
import { Token } from "../Wallets/Token";
import { TokenManager } from "../Wallets/TokenManager";
import { SeedifyLockedFarmingDataFetcher } from "./SeedifyLockedFarmingDataFetcher";

export class SeedifyLockedFarmingPool extends SeedifyLockedFarmingContract {
  private _lockDuration!: number
  private _rewardToken!: Token
  private _stakingToken!: LPToken

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    const rewardTokenAddress = await this.rewardTokenAddress()
    this._lockDuration = (await this.getLockDuration()) * 60 * 60
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

  getDataFetcher(web3: Web3) {
    return new SeedifyLockedFarmingDataFetcher(web3, this.contractAddress, this._stakingToken, this._rewardToken, this._lockDuration)
  }
}