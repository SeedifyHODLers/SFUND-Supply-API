import Web3 from "web3";
import { DataFetcher } from "./DataFetcher";

export interface PoolBase {
  init(): Promise<void>

  getDataFetcher(web3: Web3): DataFetcher

  get contractAddress(): string
}