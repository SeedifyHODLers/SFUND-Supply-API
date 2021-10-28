import Web3 from "web3";
import { AbiItem } from 'web3-utils';

export abstract class Contract {
  private _contract;

  constructor(private _web3: Web3, private _contractAddress: string, private _abi: AbiItem[]) {
    this._contract = new this._web3.eth.Contract(this._abi, this._contractAddress);
  }

  protected get contract() {
    return this._contract;
  }

  protected get abi(): AbiItem[] {
    return this._abi;
  }

  public get contractAddress(): string {
    return this._contractAddress;
  }

  protected get web3(): Web3 {
    return this._web3;
  }
}