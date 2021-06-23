import { TokenContract } from "../Contracts/TokenContract";

export class Token extends TokenContract {
  private _symbol!: string;
  private _decimals!: number;

  public async init(): Promise<void> {
    await Promise.all([
      this.getSymbol().then((symbol) => this._symbol = symbol.toLowerCase()),
      this.getDecimals().then((decimals) => this._decimals = decimals)
    ])
  }

  public get symbol(): string {
    return this._symbol;
  }

  public get decimals(): number {
    return this._decimals;
  }

  public displayAmount(amount: number): string {
    return `${amount / this._decimals} ${this._symbol}`;
  }
}