import { Token } from "./Token";

export class TokenManager {
  private static _tokens: Token[] = [];

  static get(contractAddress: string): Token | undefined {
    return this._tokens.find((token: Token) => token.contractAddress == contractAddress);
  }

  static add(token: Token): void {
    this._tokens.push(token);
  }

}