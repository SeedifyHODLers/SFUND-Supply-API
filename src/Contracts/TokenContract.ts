import Web3 from "web3";
import { AbiItem } from "web3-utils";
import tokenAbi from "../ABI/Token.json";
import { Contract } from "./Contract";

export class TokenContract extends Contract {
  constructor(web3: Web3, contractAddress: string, abi: AbiItem[] = tokenAbi as AbiItem[]) {
    super(web3, contractAddress, abi)
  }

  async getBalanceOf(address: string): Promise<number> {
    return this.contract.methods.balanceOf(address).call()
  }

  async getDecimals(): Promise<number> {
    return new Promise((resolve, reject) => this.contract.methods.decimals().call()
      .then((response: number) =>
        resolve(Math.pow(10, response))
      )
      .catch((error: string) =>
        reject(new Error(error))
      )
    )
  }

  async getName(): Promise<string> {
    return this.contract.methods.name().call();
  }

  async getSymbol(): Promise<string> {
    return this.contract.methods.symbol().call();
  }

  async getTotalSupply(): Promise<number> {
    return this.contract.methods.totalSupply().call();
  }
}