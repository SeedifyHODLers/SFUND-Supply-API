import Web3 from "web3"
import { AbiItem } from "web3-utils"
import stackingPoolAbi from "../ABI/ApeFarmingPool.json"
import { PoolInfo } from "../Interfaces/PoolInfo"
import { UserInfo } from "../Interfaces/UserInfo"
import { Contract } from "./Contract"

const SFUND_FARM_ID = 123;

export class ApeFarmingContract extends Contract {

  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress, stackingPoolAbi as AbiItem[])
  }

  async getUserInfo(address: string): Promise<UserInfo> {
    return this.contract.methods.userInfo(SFUND_FARM_ID, address).call()
  }

  async getPendingReward(address: string): Promise<number> {
    return this.contract.methods.pendingCake(SFUND_FARM_ID, address).call()
  }

  async getRewardToken(): Promise<string> {
    return this.contract.methods.cake().call()
  }

  async getPoolInfo(): Promise<PoolInfo> {
    return this.contract.methods.poolInfo(SFUND_FARM_ID).call()
  }

  async getTotalAllocPoint(): Promise<number> {
    return this.contract.methods.totalAllocPoint().call()
  }

  async getRewardPerBlock(): Promise<number> {
    return this.contract.methods.cakePerBlock().call()
  }
}