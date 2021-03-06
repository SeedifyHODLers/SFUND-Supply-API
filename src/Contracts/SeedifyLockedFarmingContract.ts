import Web3 from "web3"
import { AbiItem } from "web3-utils"
import stackingPoolAbi from "../ABI/SeedifyLockedFarmingPool.json"
import { FarmUserDeposit } from "../Interfaces/FarmUserDeposit"
import { Contract } from "./Contract"

export class SeedifyLockedFarmingContract extends Contract {

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress, stackingPoolAbi as AbiItem[])
  }

  async stakedBalance(): Promise<number> {
    return this.contract.methods.stakedBalance().call()

  }
  async rewardBalance(): Promise<number> {
    return this.contract.methods.rewardBalance().call()
  }

  async stakedTotal(): Promise<number> {
    return this.contract.methods.stakedTotal().call()
  }

  async lockDuration(): Promise<number> {
    return this.contract.methods.lockDuration().call()
  }

  async stakingTokenAddress(): Promise<string> {
    return this.contract.methods.tokenAddress().call()
  }

  async rewardTokenAddress(): Promise<string> {
    return this.contract.methods.rewardTokenAddress().call()
  }

  async getUserDeposits(address: string): Promise<FarmUserDeposit> {
    return new Promise((resolve) => this.contract.methods.userDeposits(address).call()
      .then((response: FarmUserDeposit) => resolve(response))
      .catch(() => resolve({
        amount: 0,
        initialStake: 0,
        latestClaim: 0,
        currentPeriod: 0
      } as FarmUserDeposit)))
  }

  async calculate(address: string): Promise<number> {
    return new Promise((resolve) => this.contract.methods.calculate(address).call()
      .then((response: number) => resolve(response))
      .catch(() => resolve(0)))
  }

  async blocksPerHour(): Promise<number> {
    return this.contract.methods.blocksPerHour().call()
  }

  async rewPerBlock(): Promise<number> {
    return this.contract.methods.rewPerBlock().call()
  }

}