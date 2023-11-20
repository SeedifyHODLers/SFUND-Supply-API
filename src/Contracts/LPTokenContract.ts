import { AbiItem } from "web3-utils";
import lpTokenAbi from "../ABI/LPToken.json";
import { Reserve } from "../Interfaces/Reserve";
import { TokenContract } from "./TokenContract";
import type Web3 from "web3";

export class LPTokenContract extends TokenContract {
  constructor(web3: Web3, contractAddress: string) {
    super(web3, contractAddress, lpTokenAbi as AbiItem[])
  }

  async getReserves(): Promise<Reserve> {
    return this.contract.methods.getReserves().call();
  }

  async getToken0(): Promise<string> {
    return this.contract.methods.token0().call();
  }

  async getToken1(): Promise<string> {
    return this.contract.methods.token1().call();
  }

}
