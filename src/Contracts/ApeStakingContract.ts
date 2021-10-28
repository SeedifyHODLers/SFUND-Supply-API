import Web3 from "web3"
import { AbiItem } from "web3-utils"
import stackingPoolAbi from "../ABI/ApeStakinkPool.json"
import { UserInfo } from "../Interfaces/UserInfo"
import { Contract } from "./Contract"

export abstract class ApeStakingContract extends Contract {
  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress, stackingPoolAbi as AbiItem[])
  }

  async getUserInfo(address: string): Promise<UserInfo> {
    return this.contract.methods.userInfo(address).call()
  }

  async getPendingReward(address: string): Promise<number> {
    return this.contract.methods.pendingReward(address).call()
  }

  async getRewardToken(): Promise<string> {
    return this.contract.methods.REWARD_TOKEN().call()
  }

  async getStakingToken(): Promise<string> {
    return this.contract.methods.STAKE_TOKEN().call()
  }

  async getAllStakedAmount(): Promise<number> {
    return this.contract.methods.totalStaked().call()
  }

  async getRewardPerBlock(): Promise<number> {
    return this.contract.methods.rewardPerBlock().call()
  }
}