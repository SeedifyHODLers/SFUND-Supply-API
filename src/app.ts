import debug from 'debug';
import fastify from 'fastify';
import Web3 from 'web3';
import { mcapRoute } from './MCap/mcapRoute';
import { ApeFarmingPool } from './Pools/ApeFarmingPool';
import { ApeStakingPool } from './Pools/ApeStakingPool';
import { PoolManager } from './Pools/PoolManager';
import { SeedifyLockedFarmingPool } from './Pools/SeedifyLockedFarmingPool';
import { SeedifyLockedStakingPool } from './Pools/SeedifyLockedStakingPool';
import { walletRoute } from './Wallets/walletRoute';

const app = fastify({ logger: true })
const port = process.env.PORT || 3000;
const debugLog: debug.IDebugger = debug('app');
const querystring = require('querystring')

app.register(require('fastify-cors'), {
  origin: true,
  querystringParser: (str: string) => querystring.parse(str.toLowerCase())
})


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
const seedifyLockedPoolAddresses: string[] = [process.env.LOCKED_STAKING_7D, process.env.LOCKED_STAKING_14D, process.env.LOCKED_STAKING_30D, process.env.LOCKED_STAKING_60D].filter(addr => addr !== undefined) as string[]
const apeStakingAddress: string | undefined = process.env.APE_STAKING
const apeFarmingAddress: string | undefined = process.env.APE_FARM
const seedifyLockedFarmPoolAddresses: string[] = [process.env.LOCKED_FARM_CAKE_LP, process.env.LOCKED_FARM_BAKE_LP].filter(addr => addr !== undefined) as string[]

start().catch(e => console.warn(e))

async function start() {
  console.log("start")
  console.log("check node is listening")
  try {
    if (await web3.eth.net.isListening()) {
      console.log("is listening")
      for (let address of seedifyLockedPoolAddresses) {
        console.log(`${address} : initialisation...`)
        const stakingPool = new SeedifyLockedStakingPool(web3, address)
        await stakingPool.init().then(() => PoolManager.addPool(stakingPool))
        console.log(`${address} : ok`)
      }
      for (let address of seedifyLockedFarmPoolAddresses) {
        console.log(`${address} : initialisation...`)
        const stakingPool = new SeedifyLockedFarmingPool(web3, address)
        await stakingPool.init().then(() => PoolManager.addPool(stakingPool))
        console.log(`${address} : ok`)
      }
      if (undefined !== apeStakingAddress) {
        console.log(`${apeStakingAddress} : initialisation...`)
        const apeStakingPool = new ApeStakingPool(web3, apeStakingAddress)
        await apeStakingPool.init().then(() => PoolManager.addPool(apeStakingPool))
        console.log(`${apeStakingAddress} : ok`)
      }
      if (undefined !== apeFarmingAddress) {
        console.log(`${apeFarmingAddress} : initialisation...`)
        const apeFarmingPool = new ApeFarmingPool(web3, apeFarmingAddress)
        await apeFarmingPool.init().then(() => PoolManager.addPool(apeFarmingPool))
        console.log(`${apeFarmingAddress} : ok`)
      }

      app.register(walletRoute)
      app.register(mcapRoute)

      app.listen(port, '0.0.0.0', (err, address) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        console.log(`Server listening at ${address}`)
      })
    }
  } catch (e) {
    console.warn(e)
  }
}
