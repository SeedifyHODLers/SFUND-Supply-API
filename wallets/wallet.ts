import { BscscanService } from "./BscscanService";
import { LiquidityProvider } from "./LiquidityProvider";
import { TokenTrx } from "./tokentrx";

export class Wallet {
  private _address: string;
  private _lpList = [
    // Pancake Swap
    new LiquidityProvider("0x74fA517715C4ec65EF01d55ad5335f90dce7CC87", "0x0EF7Bd72eca5e2562b87FDf7E83dD30f81A6670B"),
    // Bakery Swap
    new LiquidityProvider("0x782f3f0d2b321D5aB7F15cd1665B95EC479Dcfa5", "0x8186aC36402645cC0B8e913CE4912fB0790bC9e6"),
    // Jul Swap
    new LiquidityProvider("0xF94FD45b0c7F2b305040CeA4958A9Ab8Ee73e1F4", "0x212a6497CFC9d41B0acdacc340D9993e619829C1")
  ]
  farmingTotalSfund: number = 0;
  farmingTotalBnb: number = 0;
  onlyHarvest: string = "0x0000000000000000000000000000000000000000000000000000000000000000";
  static sfundContractAddress: string = "0x477bc8d23c634c154061869478bce96be6045d12";
  static bnbContractAddress: string = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  tosdisSfundStakingAddress: string = "0xF17C06eb029F6Ab934E09CA4766eC373A78081B3";
  stakedsfundamount: number = 0;
  walletsfundsupply: number = 0;
  harvestTopic: string = "0x933735aa8de6d7547d0126171b2f31b9c34dd00f3ecd4be85a0ba047db4fafef";
  startBlock: number = 6000000;
  bscscanApi = new BscscanService("https://api.bscscan.com/api", "WRS8IF8SBV2Q6MHN3U4Y5W7HFZS3K91XVV")

  constructor(address: string) {
    if (this.isValidAddress(address)) {
      this._address = address;
    } else {
      throw new Error("Incorrect address")
    }
  }

  getInfos(): any {
    return {
      total: {
        sfund: this.farmingTotalSfund + this.stakedsfundamount + this.walletsfundsupply,
        bnb: this.farmingTotalBnb
      },
      staked: {
        sfund: this.stakedsfundamount
      },
      farm: {
        sfund: this.farmingTotalSfund,
        bnb: this.farmingTotalBnb
      },
      wallet: {
        sfund: this.walletsfundsupply
      }
    };
  }

  getTotalSfundAmount(): number {
    console.log("farming : " + this.farmingTotalSfund);
    console.log("staked : " + this.stakedsfundamount);
    console.log("wallet : " + this.walletsfundsupply);
    return this.farmingTotalSfund + this.stakedsfundamount + this.walletsfundsupply;
  }

  getTokenInLp(lpNumber: number, tokenTotalAmount: number, lpTotalSupply: number): number {
    return lpNumber * (tokenTotalAmount / lpTotalSupply);
  }

  amountdecimal(value: number) {
    return parseFloat((value / 1000000000000000000).toFixed(2));
  }

  async getWalletInfos(): Promise<void> {
    this.farmingTotalSfund = 0;
    this.farmingTotalBnb = 0;
    const tokenTxList: TokenTrx[] = await this.getTokenTxList();
    for (const lp of this._lpList) {
      lp.lpFound = this.threatTokenTx(tokenTxList, lp.address, lp.farmAddress);
      if (lp.lpFound > 0) {
        await this.fetchInfos(lp);
        this.farmingTotalSfund += ((lp.sfundAmount / lp.totalSupply) * lp.lpFound);
        this.farmingTotalBnb += ((lp.bnbAmount / lp.totalSupply) * lp.lpFound);
      }
    }
    const trxToIgnore = await this.getHarvestTrx().then(log => log.filter((trx: { data: string; }) => trx.data.substring(0, 66) == this.onlyHarvest).map((trx: { transactionHash: string; }) => trx.transactionHash));
    this.stakedsfundamount = this.threatTokenTx(tokenTxList, Wallet.sfundContractAddress, this.tosdisSfundStakingAddress, trxToIgnore);
    this.walletsfundsupply = this.amountdecimal(await this.getContractBalance(Wallet.sfundContractAddress, this._address));
  }

  async getTokenTxList(): Promise<TokenTrx[]> {
    return this.bscscanApi.get("account", "tokentx", { key: "address", value: this._address }, { key: "startblock", value: String(this.startBlock) }, { key: "sort", value: "desc" })
  }

  // used to compute all transactions about one contract, simply + when trx "to" and - when trx "from"
  threatTokenTx(tokenTxList: TokenTrx[], tokenContractAddress: string, stakingContractAddress: string, trxToIgnore: string[] = []) {
    let lpfound = 0;
    let lastHash = "";
    let ignore = false;
    tokenTxList = tokenTxList.filter(
      (tokenTx: TokenTrx) => {
        // we want to ignore the second transaction in the same hash (1st = unstake/stake, 2nd = auto harvest)
        ignore = lastHash == tokenTx.hash || trxToIgnore.includes(tokenTx.hash)
        lastHash = tokenTx.hash
        return !ignore
          && this.compareIgnoreCase(tokenTx.contractAddress, tokenContractAddress)
          && (this.compareIgnoreCase(tokenTx.to, stakingContractAddress) || this.compareIgnoreCase(tokenTx.from, stakingContractAddress))
      });
    tokenTxList.forEach(
      (tokenTx: TokenTrx) => (
        lpfound = this.compareIgnoreCase(tokenTx.to, stakingContractAddress) ? lpfound + parseInt(tokenTx.value) : lpfound - parseInt(tokenTx.value)
      )
    );
    return this.amountdecimal(lpfound)
  }

  isValidAddress = (address: string): boolean => /^(0x)?[0-9a-f]{40}$/i.test(address)

  compareIgnoreCase = (s1: string, s2: string): boolean => s1.toUpperCase() == s2.toUpperCase()

  async getTokenSupply(contract: string): Promise<number> | never {
    return this.bscscanApi.get("stats", "tokensupply", { key: "contractaddress", value: contract })
  }

  async getContractBalance(contract: string, addr: string): Promise<number> | never {
    const amount: number | string = await this.bscscanApi.get("account", "tokenbalance", { key: "contractaddress", value: contract }, { key: "address", value: addr }, { key: "tag", value: "latest" })
    return typeof amount == 'string' ? parseInt(amount) : amount;
  }

  // We need to identify harvest trx to ignore it (only usefull for staking pool)
  async getHarvestTrx(): Promise<any> {
    return this.bscscanApi.get("logs", "getLogs", { key: "fromBlock", value: String(this.startBlock) },
      { key: "toBlock", value: "latest" }, { key: "address", value: this.tosdisSfundStakingAddress },
      { key: "topic0", value: this.harvestTopic }, { key: "topic1", value: "0x000000000000000000000000" + this._address.substring(2) })
  }

  async fetchInfos(lp: LiquidityProvider): Promise<void> {
    lp.totalSupply = await this.getTokenSupply(lp.address);
    lp.bnbAmount = await this.getContractBalance(Wallet.bnbContractAddress, lp.address);
    lp.sfundAmount = await this.getContractBalance(Wallet.sfundContractAddress, lp.address);
  }
}