import express from 'express';
import Web3 from 'web3';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { ConfigError } from '../ConfigError';
import { Pool } from '../Pools/Pool';
import { PoolManager } from '../Pools/PoolManager';
import { LPToken } from './LPToken';
import { TokenManager } from './TokenManager';
import { Wallet } from './Wallet';

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
export class WalletsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'WalletsRoutes');
  }

  configureRoutes() {
    this.app.route(`/wallet/:addr`)
      .get(async (req: express.Request, res: express.Response) => {
        try {
          if (Web3.utils.isAddress(req.params.addr)) {
            const wallet = new Wallet(req.params.addr, PoolManager.getAll())
            await wallet.initPools()
            await wallet.fetchInfos()
            res.status(200).send(wallet.infosAsJson());
          }
          else {
            throw new Error("Invalid address")
          }
        }
        catch (e) {
          if (e instanceof ConfigError) {
            console.log(e);
            res.status(e.code).send({ error: "Internal server error" });
          }
          else if (e instanceof Error) {
            console.log(e.stack)
            res.status(400).send({ error: e.message });
          }
          else {
            console.log(e);
            res.status(500)
          }
        }
      })
    this.app.route(`/lp/:addr`)
      .get(async (req: express.Request, res: express.Response) => {
        try {
          const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443", options));
          if (web3.utils.isAddress(req.params.addr)) {
            let lpToken = TokenManager.getLPToken(req.params.addr)
            if (lpToken === undefined) {
              lpToken = new LPToken(web3, req.params.addr)
              await lpToken.init()
            }
            await lpToken.fetchInfos()
            res.status(200).send(lpToken.infosAsJson());
          }
          else {
            throw new Error("Invalid address")
          }
        }
        catch (e) {
          console.log(e);
          if (e instanceof ConfigError) {
            res.status(e.code).send({ error: "Internal server error" });
          }
          else if (e instanceof Error) {
            res.status(400).send({ error: e.message });
          }
          else {
            res.status(500)
          }
        }
      })
    this.app.route(`/pools`)
      .get(async (req: express.Request, res: express.Response) => {
        try {
          const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443", options));
          const isListening = await web3.eth.net.isListening()
          if (isListening) {
            const stakingPoolAddress: string[] = [process.env.SFUND_STAKING, process.env.PANCAKE_FARM, process.env.BAKERY_FARM].filter(addr => addr !== undefined) as string[]
            const apeStakingPoolAddress: string | undefined = process.env.APE_STAKING;
            const apeFarmingPoolAddress: string | undefined = process.env.APE_FARM;
            const seedifyLockedFarmPoolAddresses: string[] = [process.env.LOCKED_FARM_CAKE_LP, process.env.LOCKED_FARM_BAKE_LP].filter(addr => addr !== undefined) as string[]
            const poolsInfos = new Pool(web3, stakingPoolAddress, apeStakingPoolAddress, apeFarmingPoolAddress)
            res.status(200).send(poolsInfos.asJSON());
          }
          else {
            throw new ConfigError("Web3 connection not listening")
          }
        }
        catch (e) {
          console.log(e);
          if (e instanceof ConfigError) {
            res.status(e.code).send({ error: "Internal server error" });
          }
          else if (e instanceof Error) {
            res.status(400).send({ error: e.message });
          }
          else {
            res.status(500)
          }
        }
      })
    return this.app;
  }
}

