import {SeedifyLockedStakingPool} from "./Pools/SeedifyLockedStakingPool";

require('dotenv').config()
import debug from 'debug';
import {configure, initializeWeb3, setupFastify, initializeServer, initializePools} from './utils';
import { mcapRoute } from './MCap/mcapRoute';
import { walletRoute } from './Wallets/walletRoute';
import { PoolManager } from './Pools/PoolManager';
import {SeedifyLockedFarmingPool} from "./Pools/SeedifyLockedFarmingPool";
const config = configure();

const app = setupFastify();

const debugLog: debug.IDebugger = debug('app');

const web3BSC = initializeWeb3(config.bscNodeUrl)
const web3ETH = initializeWeb3(config.ethNodeUrl)
const web3ARB = initializeWeb3(config.arbNodeUrl)

start().catch(e => console.warn(e))

async function start() {
  console.log("start")
  console.log("check node is listening")
  try {
    if (await web3BSC.eth.net.isListening() && await web3ETH.eth.net.isListening()) {
      console.log("is listening")

      await initializePools(web3BSC, config.StakingBSC, SeedifyLockedStakingPool, PoolManager);
      await initializePools(web3BSC, config.FarmingBSC, SeedifyLockedFarmingPool, PoolManager);
      await initializePools(web3ETH, config.StakingETH, SeedifyLockedStakingPool, PoolManager);
      await initializePools(web3ETH, config.FarmingETH, SeedifyLockedFarmingPool, PoolManager);
      await initializePools(web3ARB, config.StakingARB, SeedifyLockedStakingPool, PoolManager);
      await initializePools(web3ARB, config.FarmingARB, SeedifyLockedFarmingPool, PoolManager);

      app.register(walletRoute)
      app.register(mcapRoute)
      await initializeServer(app, Number(process.env.PORT || 3000));
    }
  } catch (e) {
    console.warn(e)
  }
}
