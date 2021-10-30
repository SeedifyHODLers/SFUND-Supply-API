import Web3 from "web3";
import { MCap } from "../MCap/MCap";

try {
  const options = {
    timeout: 30000, // ms

    clientConfig: {
      // Useful if requests are large
      maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
      maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

      // Useful to keep a connection alive
      keepalive: true,
      keepaliveInterval: -1 // ms
    },

    // Enable auto reconnection
    reconnect: {
      auto: true,
      delay: 60000, // ms
      onTimeout: false
    }
  };

  const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443", options));
  const mcap = new MCap(web3, "0x477bc8d23c634c154061869478bce96be6045d12")

  mcap.fetchFromWeb3().then(() => mcap.saveInDb().catch(err => console.log(err))).catch(err => console.log(err))

} catch (err) {
  console.log(err)
}