import { ConfigError } from "../ConfigError";

export class LiquidityProvider {

  private _address: string;
  private _farmAddress: string;
  private _lpFound: number = 0;
  private _sfundTotalAmount: number = 0;
  private _bnbTotalAmount: number = 0;
  private _totalSupply: number = 0;
  private _name: string;

  constructor(name: string, address: string, farmAddress: string | undefined) {
    this._name = name;
    this._address = address;
    if (typeof farmAddress == "undefined") {
      throw new ConfigError(`Farming address for ${address} is not defined`);
    }
    this._farmAddress = farmAddress;
  }

  public get name(): string {
    return this._name;
  }

  public get bnbTotalAmount(): number {
    return this._bnbTotalAmount;
  }

  public set bnbTotalAmount(value: number) {
    this._bnbTotalAmount = value;
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

  public get sfundTotalAmount(): number {
    return this._sfundTotalAmount;
  }

  public set sfundTotalAmount(value: number) {
    this._sfundTotalAmount = value;
  }

  public get sfundAmount(): number {
    return parseFloat((this._lpFound * (this._sfundTotalAmount / this._totalSupply)).toFixed(2));
  }

  public get bnbAmount(): number {
    return parseFloat((this._lpFound * (this._bnbTotalAmount / this._totalSupply)).toFixed(2));
  }
}