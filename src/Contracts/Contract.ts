import { AbiItem } from 'web3-utils';
import type Web3 from "web3";

export abstract class Contract {
  private _contract;
  private _chainId: number | undefined;

  constructor(private _web3: Web3, private _contractAddress: string, private _abi: AbiItem[]) {
    this._contract = new this._web3.eth.Contract(this._abi, this._contractAddress);
    _web3.eth.getChainId().then((chainId) => this._chainId = chainId);
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

  public get chainId() {
    return this._chainId;
  }

  public get web3(): Web3 {
    return this._web3;
  }
}
