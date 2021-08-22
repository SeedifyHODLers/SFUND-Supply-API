export class EntityWallet {
  private _amount: number = 0;

  constructor(private _name: string, private _address: string) { }

  public get amount(): number {
    return this._amount;
  }

  public set amount(value: number) {
    this._amount = value;
  }

  public get address(): string {
    return this._address;
  }

  public get name(): string {
    return this._name;
  }

  toJson(): JSON {
    return JSON.parse(JSON.stringify({
      name: this._name,
      amount: this._amount
    }))
  }
}