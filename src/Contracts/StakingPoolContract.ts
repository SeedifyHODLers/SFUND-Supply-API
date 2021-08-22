import Web3 from "web3"
import { AbiItem } from "web3-utils"
import stackingPoolAbi from "../ABI/StakingPool.json"
import { Contract } from "./Contract"

export class StakingPoolContract extends Contract {
  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress, stackingPoolAbi.abi as AbiItem[])
  }

  async getUserInfo(address: string): Promise<number> {
    return new Promise((resolve, reject) => this.contract.methods.getUserInfo(address).call()
      .then((response: { 0: string, 1: string }) =>
        resolve(parseInt(response[0])))
      .catch((error: string) => reject(new Error(error))))
  }

  async getPendingReward(address: string): Promise<number> {
    return this.contract.methods.pendingReward(address).call()
  }

  async getRewardToken(): Promise<string> {
    return this.contract.methods.rewardToken().call()
  }

  async getStakingToken(): Promise<string> {
    return this.contract.methods.stakingToken().call()
  }

  async getStartTime(): Promise<number> {
    return this.contract.methods.startTime().call()
  }

  async getFinishTime(): Promise<number> {
    return this.contract.methods.finishTime().call()
  }

  async getAllStakedAmount(): Promise<number> {
    return this.contract.methods.allStakedAmount().call()
  }

  async getRewardPerSec(): Promise<number> {
    return this.contract.methods.rewardPerSec().call()
  }

  async getLastRewardTime(): Promise<number> {
    return this.contract.methods.lastRewardTime().call()
  }

  async getPoolTokenAmount(): Promise<number> {
    return this.contract.methods.poolTokenAmount().call()
  }

}