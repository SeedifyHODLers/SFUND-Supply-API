export class ConfigError extends Error {
  constructor(message: string, private _code: number = 500) {
    super(message);
  }
  public get code(): number {
    return this._code;
  }
}