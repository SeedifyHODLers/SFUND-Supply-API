import { ConfigError } from "../ConfigError";

export class LiquidityProvider {

  private _address: string;
  private _farmAddress: string;
  private _lpFound: number = 0;
  private _sfundAmount: number = 0;
  private _bnbAmount: number = 0;
  private _totalSupply: number = 0;

  constructor(address: string, farmAddress: string | undefined) {
    this._address = address;
    if (typeof farmAddress == "undefined") {
      throw new ConfigError(`Farming address for ${address} is not defined`);
    }
    this._farmAddress = farmAddress;
  }

  public get bnbAmount(): number {
    return this._bnbAmount;
  }
  public set bnbAmount(value: number) {
    this._bnbAmount = value;
  }
  public get totalSupply(): number {
    return this._totalSupply;
  }
  public set totalSupply(value: number) {
    this._totalSupply = value;
  }
  public get address(): string {
    return this._address;
  }

  public get lpFound(): number {
    return this._lpFound;
  }

  public set lpFound(value: number) {
    this._lpFound = value;
  }

  public get farmAddress(): string {
    return this._farmAddress;
  }
  public get sfundAmount(): number {
    return this._sfundAmount;
  }
  public set sfundAmount(value: number) {
    this._sfundAmount = value;
  }
}