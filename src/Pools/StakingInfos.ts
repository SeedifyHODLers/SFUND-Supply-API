import { PoolInfos } from "./PoolInfos";

export class StakingInfos extends PoolInfos {

  public asJSON(): JSON {
    return JSON.parse(JSON.stringify({
      "tokens": Object.fromEntries(this.tokens.entries()),
      "pendingReward": Object.fromEntries(this.pendingReward.entries()),
      "rewardPerSec": this.rewardPerSec
    }))
  }
}