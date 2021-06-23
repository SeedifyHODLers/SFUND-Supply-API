import express from 'express';
import Web3 from 'web3';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { ConfigError } from '../ConfigError';
import { Wallet } from './Wallet';

export class WalletsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'WalletsRoutes');
  }

  configureRoutes() {
    this.app.route(`/wallet/:addr`)
      .get(async (req: express.Request, res: express.Response) => {
        try {
          const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443"));
          const isListening = await web3.eth.net.isListening()
          if (isListening) {
            if (web3.utils.isAddress(req.params.addr)) {
              const stakingPoolAddress: string[] = [process.env.SFUND_STAKING, process.env.PANCAKE_FARM, process.env.BAKERY_FARM, process.env.JUL_FARM].filter(addr => addr !== undefined) as string[]
              const wallet = new Wallet(web3, stakingPoolAddress, req.params.addr)
              await wallet.fetchInfos()
              res.status(200).send(wallet.infosAsJson());
            }
            else {
              throw new Error("Invalid address")
            }
          }
          else {
            throw new ConfigError("Web3 connection not listening")
          }
        }
        catch (e) {
          console.log(e.message);
          if (e instanceof ConfigError) {
            res.status(e.code).send({ error: "Internal server error" });
          }
          else {
            res.status(400).send({ error: e.message });
          }
        }
      })
    return this.app;
  }
}

