import Web3 from "web3"
import { AbiItem } from "web3-utils"
import stackingPoolAbi from "../ABI/SeedifyLockedStakingPool.json"
import { StakingUserDeposit } from "../Interfaces/StakingUserDeposit"
import { Contract } from "./Contract"

export class SeedifyLockedStakingContract extends Contract {

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress, stackingPoolAbi as AbiItem[])
  }

  async stakedBalance(): Promise<number> {
    return this.contract.methods.stakedBalance().call()

  }
  async rewardBalance(): Promise<number> {
    return this.contract.methods.rewardBalance().call();
  }

  async stakedTotal(): Promise<number> {
    return this.contract.methods.stakedTotal().call();
  }

  async interestRateConverter(): Promise<number> {
    return this.contract.methods.interestRateConverter().call();
  }

  async rate(): Promise<number> {
    return this.contract.methods.rate().call();
  }

  async name(): Promise<string> {
    return this.contract.methods.name().call();
  }

  async getLockDuration(): Promise<number> {
    return this.contract.methods.lockDuration().call();
  }

  async tokenAddress(): Promise<string> {
    return this.contract.methods.ERC20Interface().call();
  }

  async getUserDeposits(address: string): Promise<StakingUserDeposit> {
    return this.contract.methods.userDeposits(address).call()
  }

  async calculate(address: string): Promise<number> {
    return this.contract.methods.calculate(address).call()
  }

}