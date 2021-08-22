import Web3 from "web3";
import { MCap } from "../MCap/MCap";

try {
  const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443"));

  const mcap = new MCap(web3, "0x477bc8d23c634c154061869478bce96be6045d12")

  mcap.fetchFromWeb3().then(() => mcap.saveInDb().catch(err => console.log(err))).catch(err => console.log(err))
} catch (err) {
  console.log(err)
}