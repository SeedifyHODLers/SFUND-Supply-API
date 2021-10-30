import Web3 from "web3";
import { LockContract } from "../Contracts/LockContract";
import { SeedifyLockedFarmingContract } from "../Contracts/SeedifyLockedFarmingContract";
import { SeedifyLockedStakingContract } from "../Contracts/SeedifyLockedStakingContract";
import { TokenContract } from "../Contracts/TokenContract";
import client from '../DbConnector';
import { EntityWallet } from "./EntityWallet";

export class MCap {
  public get circulatingSupply() {
    return this._circulatingSupply
  }
  readonly burnAddresses = ["0x0000000000000000000000000000000000000000", "0x000000000000000000000000000000000000dEaD"]
  readonly exchangesWallets: EntityWallet[] = [
    new EntityWallet("PancakeSwap V2", "0x74fA517715C4ec65EF01d55ad5335f90dce7CC87"),
    new EntityWallet("BakerySwap", "0x782f3f0d2b321d5ab7f15cd1665b95ec479dcfa5"),
    new EntityWallet("KuCoin", "0x4cf8800ccc0a56396f77b1e7c46160f5df0e09a5"),
    new EntityWallet("PancakeSwap V1", "0x33338c4fdb9a4a18c5c280c30338acda1b244425"),
    new EntityWallet("JulSwap", "0xf94fd45b0c7f2b305040cea4958a9ab8ee73e1f4"),
    new EntityWallet("Digifinex", "0xffefe959d8baea028b1697abfc4285028d6ceb10")
  ]
  readonly teamWallets: EntityWallet[] = [
    new EntityWallet("Operations Pool", "0x88dba2cf8911a80cc50a1b392b5ff6b47b930330"),
    new EntityWallet("Community Rewards Pool", "0xabdc47535cc7c83fccfb3e74fde5ea2761c3c7a7")
  ]
  readonly lockContractAddress = "0x7536592bb74b5d62eb82e8b93b17eed4eed9a85c"
  readonly stakingPoolAddresses = [process.env.LOCKED_STAKING_7D, process.env.LOCKED_STAKING_14D, process.env.LOCKED_STAKING_30D, process.env.LOCKED_STAKING_60D]
  readonly farmingPoolAddresses = [process.env.LOCKED_FARM_CAKE_LP, process.env.LOCKED_FARM_BAKE_LP]

  private _maxSupply: number = 0
  private _totalSupply: number = 0
  private _circulatingSupply: number = 0

  private _decimals: number = 0

  constructor(private _web3: Web3, private _contractAddr: string) { }

  public fetchFromWeb3 = async (): Promise<void> => {
    const tokenContract = new TokenContract(this._web3, this._contractAddr)
    // decimals
    this._decimals = await tokenContract.getDecimals()
    // Team wallets
    await Promise.all(this.teamWallets.map(async wallet => {
      return tokenContract.getBalanceOf(wallet.address).then(amount => wallet.amount = this.amountDecimal(amount))
    }))
    // Exchanges wallets
    await Promise.all(this.exchangesWallets.map(async wallet => {
      return tokenContract.getBalanceOf(wallet.address).then(amount => wallet.amount = this.amountDecimal(amount))
    }))
    // Max Supply
    this._maxSupply = this.amountDecimal(await tokenContract.getTotalSupply())
    // Total Supply
    this._totalSupply = this._maxSupply
    await Promise.all(this.burnAddresses.map(async addr => {
      return tokenContract.getBalanceOf(addr).then(amount => this._totalSupply -= this.amountDecimal(amount))
    }))
    // Locked Supply
    this._circulatingSupply = this._totalSupply
    const lockContract = new LockContract(this._web3, this.lockContractAddress)
    this._circulatingSupply -= this.amountDecimal(await lockContract.getTotalTokenBalance(this._contractAddr))
    for (const contractAddr of this.stakingPoolAddresses) {
      if (typeof contractAddr === "string") {
        const pool = new SeedifyLockedStakingContract(this._web3, contractAddr)
        const rewardBalance = await pool.rewardBalance()
        this._circulatingSupply -= (this.amountDecimal(rewardBalance))
      }
    }
    for (const contractAddr of this.farmingPoolAddresses) {
      if (typeof contractAddr === "string") {
        const pool = new SeedifyLockedFarmingContract(this._web3, contractAddr)
        const rewardBalance = await pool.rewardBalance()
        this._circulatingSupply -= (this.amountDecimal(rewardBalance))
      }
    }
    await Promise.all(this.teamWallets.map(wallet => {
      this._circulatingSupply -= wallet.amount
    }))
  }

  fetchFromDb = async () => {
    await new Promise<boolean>((resolve, reject) => {
      client.query("SELECT * FROM supply", (err, res) => {
        if (err) {
          reject(err)
        }
        res.rows.forEach(row => {
          this._maxSupply = row['max']
          this._totalSupply = row['total']
          this._circulatingSupply = row['circulating']
        })
        resolve(true)
      })
    }).catch(err => console.log(err))

    const fetchRows = (table: string) => {
      return new Promise<any>((resolve, reject) => {
        client.query(`SELECT * FROM ${table}`, async (err, res) => {
          if (err) {
            reject(err)
          }
          resolve(res.rows)
        })
      }).catch(err => console.log(err))
    }

    const teamRows = await fetchRows("team_wallets")

    this.teamWallets.forEach(wallet => {
      wallet.amount = teamRows.find((row: { [x: string]: string | number }) => row['name'] === wallet.name)['amount']
    })

    const exchangesRows = await fetchRows("exchange_wallets")

    this.exchangesWallets.forEach(wallet => {
      wallet.amount = exchangesRows.find((row: { [x: string]: string | number }) => row['name'] === wallet.name)['amount']
    })
  }

  saveInDb = async () => {
    await client.query(`TRUNCATE TABLE supply;
INSERT INTO supply VALUES(${this._totalSupply}, ${this._maxSupply}, ${this._circulatingSupply})`)

    await client.query(this.teamWallets.map(wallet =>
      `INSERT INTO team_wallets (name, amount) VALUES('${wallet.name}', ${wallet.amount})
ON CONFLICT (name)
DO UPDATE
SET amount = ${wallet.amount};`).join(" ")
    )

    await client.query(this.exchangesWallets.map(wallet =>
      `INSERT INTO exchange_wallets (name, amount) VALUES('${wallet.name}', ${wallet.amount})
ON CONFLICT (name)
DO UPDATE
SET amount = ${wallet.amount};`).join(" ")
    )
  }

  private amountDecimal = (value: number): number => {
    return value / this._decimals
  }

  private reducer = (accumulator: number, currentValue: number): number => {
    return (accumulator + currentValue)
  }

  public static toDisplay = (value: number): number => {
    return parseFloat(value.toFixed(2))
  }

  public infosAsJson = (): JSON => {
    return JSON.parse(JSON.stringify({
      "maxSupply": MCap.toDisplay(this._maxSupply),
      "totalSupply": MCap.toDisplay(this._totalSupply),
      "circulatingSupply": MCap.toDisplay(this._circulatingSupply),
      "teamWallets": {
        "total": MCap.toDisplay(this.teamWallets.map(wallet => wallet.amount).reduce(this.reducer, 0)),
        "details": this.teamWallets.map(wallet => wallet.toJson())
      },
      "exchangesWallets": {
        "total": MCap.toDisplay(this.exchangesWallets.map(wallet => wallet.amount).reduce(this.reducer, 0)),
        "details": this.exchangesWallets.map(wallet => wallet.toJson())
      }
    }))
  }

}
