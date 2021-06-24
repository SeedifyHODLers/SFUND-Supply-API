import { LPTokenContract } from "../Contracts/LPTokenContract";
import { Token } from "./Token";
import { TokenManager } from "./TokenManager";

export class LPToken extends LPTokenContract {
  private _token0!: Token;
  private _token1!: Token;
  private _reserves!: Reserve
  private _totalSupply!: number;
  private _symbol!: string;
  private _decimals!: number;

  public async init(): Promise<void> {
    const works: Promise<void | string | number | Reserve>[] = []
    works.push(this.getSymbol().then(symbol => this._symbol = symbol.toLowerCase()))
    works.push(this.getDecimals().then(decimals => this._decimals = decimals))
    works.push(this.getReserves().then(reserves => this._reserves = reserves))
    works.push(this.getTotalSupply().then(totalSupply => this._totalSupply = totalSupply))
    const tokenAddress0 = await this.getToken0();
    const token0 = TokenManager.get(tokenAddress0)
    if (token0 === undefined) {
      this._token0 = new Token(this.web3, tokenAddress0);
      works.push(this._token0.init().then(() => TokenManager.add(this._token0)))
    }
    else {
      this._token0 = token0;
    }
    const tokenAddress1 = await this.getToken1();
    const token1 = TokenManager.get(tokenAddress1)
    if (token1 === undefined) {
      this._token1 = new Token(this.web3, tokenAddress1);
      works.push(this._token1.init().then(() => TokenManager.add(this._token1)))
    }
    else {
      this._token1 = token1;
    }
    await Promise.all(works)
  }

  public get symbol(): string {
    return this._symbol;
  }

  public get totalSupply(): number {
    return this._totalSupply;
  }

  public getToken0Amount(): number {
    return this._reserves._reserve0;
  }

  public getToken1Amount(): number {
    return this._reserves._reserve1;
  }

  public get token0(): Token {
    return this._token0;
  }

  public get token1(): Token {
    return this._token1;
  }

  public get decimals(): number {
    return this._decimals
  }

  public infosAsJson(): JSON {
    return JSON.parse(JSON.stringify(
      {
        "totalSupply": this._totalSupply / this._decimals,
        "tokens":
          [
            {
              "symbol": this._token0.symbol,
              "amount": this._reserves._reserve0 / this._token0.decimals
            },
            {
              "symbol": this._token1.symbol,
              "amount": this._reserves._reserve1 / this._token1.decimals
            }
          ]
      }
    ))
  }
}