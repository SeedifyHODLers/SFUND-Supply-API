import { AbiItem } from "web3-utils";
import tokenAbi from "../ABI/LockContract.json";
import { Contract } from "./Contract";
import type Web3 from "web3";

export class LockContract extends Contract {
  constructor(web3: Web3, contractAddress: string, abi: AbiItem[] = tokenAbi as AbiItem[]) {
    super(web3, contractAddress, abi)
  }

  async getTotalTokenBalance(contractAddress: string): Promise<number> {
    return this.contract.methods.getTotalTokenBalance(contractAddress).call()
  }
}
