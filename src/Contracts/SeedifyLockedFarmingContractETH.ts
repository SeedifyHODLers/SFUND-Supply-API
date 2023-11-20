import { AbiItem } from "web3-utils"
import stackingPoolAbi from "../ABI/SeedifyLockedFarmingPoolETH.json"
import { FarmUserDeposit } from "../Interfaces/FarmUserDeposit"
import { Contract } from "./Contract"
import type Web3 from "web3"

export class SeedifyLockedFarmingContractETH extends Contract {

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress, stackingPoolAbi as AbiItem[])
  }

  async stakedBalance(): Promise<number> {
    return this.contract.methods.currentStakedBalance().call()

  }
  async rewardBalance(): Promise<number> {
    return this.contract.methods.rewardBalance().call()
  }

  async stakedTotal(): Promise<number> {
    return this.contract.methods.totalStaked().call()
  }

  async getLockDuration(): Promise<number> {
    return this.contract.methods.lockDuration().call()
  }

  async stakingTokenAddress(): Promise<string> {
    return this.contract.methods.tokenAddress().call()
  }

  async rewardTokenAddress(): Promise<string> {
    return this.contract.methods.rewardTokenAddress().call()
  }

  async getUserDeposits(address: string): Promise<FarmUserDeposit> {
    return this.contract.methods.userDeposits(address).call()
  }

  async calculate(address: string): Promise<number> {
    return this.contract.methods.calculate(address).call().catch(() => 0)
  }

  async blocksPerHour(): Promise<number> {
    return this.contract.methods.SECONDS_PER_HOUR().call().catch(() => 0)
  }

  async rewPerBlock(): Promise<number> {
    return this.contract.methods.rewPerSecond().call()
  }

  async currentBlock(): Promise<number> {
    return 1;
  }

}
