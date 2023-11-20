import { SeedifyLockedStakingContract } from "../Contracts/SeedifyLockedStakingContract";
import { Token } from "../Wallets/Token";
import { TokenManager } from "../Wallets/TokenManager";
import { SeedifyLockedStakingDataFetcher } from "./SeedifyLockedStakingDataFetcher";
import type Web3 from "web3";

export class SeedifyLockedStakingPool extends SeedifyLockedStakingContract {
  private _lockDuration!: number
  private _token!: Token

  async init(): Promise<void> {
    const works: Promise<any>[] = []
    const tokenAddress = await this.tokenAddress()
    this._lockDuration = (await this.getLockDuration()) * 60 * 60
    const rewardToken = TokenManager.getToken(tokenAddress, this.chainId)
    if (rewardToken === undefined) {
      this._token = new Token(this.web3, tokenAddress)
      works.push(this._token.init().then(() => TokenManager.addToken(this._token)))
    }
    else {
      this._token = rewardToken
    }
    await Promise.all(works)
  }

  getDataFetcher(web3: Web3): SeedifyLockedStakingDataFetcher {
    return new SeedifyLockedStakingDataFetcher(web3, this.contractAddress, this._token, this._lockDuration)
  }
}
