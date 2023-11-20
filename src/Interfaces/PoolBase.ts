import { DataFetcher } from "./DataFetcher";
import type Web3 from "web3";

export interface PoolBase {
  init(): Promise<void>

  getDataFetcher(web3: Web3): DataFetcher

  get web3(): Web3
  get contractAddress(): string
}
