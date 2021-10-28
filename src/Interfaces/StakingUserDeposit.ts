export interface StakingUserDeposit {
  depositAmount: number
  depositTime: number
  endTime: number
  userIndex: number
  rewards: number
  paid: boolean
}