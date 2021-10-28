import { PoolInfos } from "../Pools/PoolInfos";
import { Token } from "../Wallets/Token";

export interface PoolContract {
  get contractAddress(): string

  get isFarming(): boolean

  get isLocked(): boolean

  get stakedAmount(): Map<string, number>

  get pendingAmount(): Map<string, number>

  get rewardToken(): Token

  fetchInfos(walletAddress: string): Promise<void>

  get infos(): PoolInfos

  toJSON(): JSON
}