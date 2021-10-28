import cors from 'cors';
import debug from 'debug';
import express from 'express';
import * as expressWinston from 'express-winston';
import * as http from 'http';
import Web3 from 'web3';
import * as winston from 'winston';
import { CommonRoutesConfig } from './common/common.routes.config';
import { MCapRoutes } from './MCap/mcap.routes.config';
import { ApeFarmingPool } from './Pools/ApeFarmingPool';
import { ApeStakingPool } from './Pools/ApeStakingPool';
import { PoolManager } from './Pools/PoolManager';
import { SeedifyLockedFarmingPool } from './Pools/SeedifyLockedFarmingPool';
import { SeedifyLockedStakingPool } from './Pools/SeedifyLockedStakingPool';
import { WalletsRoutes } from './Wallets/wallets.routes.config';


const app: express.Application = express();
const server: http.Server = http.createServer(app);
const port = process.env.PORT || 3000;
const routes: Array<CommonRoutesConfig> = [];
const debugLog: debug.IDebugger = debug('app');

// here we are adding middleware to parse all incoming requests as JSON
app.use(express.json());

// here we are adding middleware to allow cross-origin requests
app.use(cors());

// here we are preparing the expressWinston logging middleware configuration,
// which will automatically log all HTTP requests handled by Express.js
const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true })
  ),
};

if (!process.env.DEBUG) {
  loggerOptions.meta = false; // when not debugging, log requests as one-liners
}

// initialize the logger with the above configuration
app.use(expressWinston.logger(loggerOptions));

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

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://bsc-ws-node.nariox.org:443", options));
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

      // here we are adding the UserRoutes to our array,
      // after sending the Express.js application object to have the routes added to our app!
      routes.push(new WalletsRoutes(app));
      routes.push(new MCapRoutes(app))

      server.listen(port, () => {
        routes.forEach((route: CommonRoutesConfig) => {
          debugLog(`Routes configured for ${route.getName()}`);
        });
      });
    }
  } catch (e) {
    console.warn(e)
  }
}
