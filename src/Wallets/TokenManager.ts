import { LPToken } from "./LPToken";
import { Token } from "./Token";

export class TokenManager {
  private static _tokens: Token[] = [];
  private static _lpTokens: LPToken[] = [];

  static getToken(contractAddress: string): Token | undefined {
    return this._tokens.find((token: Token) => token.contractAddress == contractAddress);
  }

  static getLPToken(lpContractAddress: string): LPToken | undefined {
    return this._lpTokens.find((token: LPToken) => token.contractAddress == lpContractAddress);
  }

  static addToken(token: Token): void {
    this._tokens.push(token);
  }

  static addLPToken(lpToken: LPToken): void {
    this._lpTokens.push(lpToken);
  }

}