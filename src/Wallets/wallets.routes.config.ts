import express from 'express';
import Web3 from 'web3';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { ConfigError } from '../ConfigError';
import { LPToken } from './LPToken';
import { TokenManager } from './TokenManager';
import { Wallet } from './Wallet';

export class WalletsRoutes extends CommonRoutesConfig {
  private _web3: Web3;
  constructor(app: express.Application) {
    super(app, 'WalletsRoutes');
    this._web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443"));
  }

  configureRoutes() {
    this.app.route(`/wallet/:addr`)
      .get(async (req: express.Request, res: express.Response) => {
        try {
          const isListening = await this._web3.eth.net.isListening()
          if (isListening) {
            if (this._web3.utils.isAddress(req.params.addr)) {
              const stakingPoolAddress: string[] = [process.env.SFUND_STAKING, process.env.PANCAKE_FARM, process.env.BAKERY_FARM].filter(addr => addr !== undefined) as string[]
              const wallet = new Wallet(this._web3, stakingPoolAddress, req.params.addr)
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
    this.app.route(`/lp/:addr`)
      .get(async (req: express.Request, res: express.Response) => {
        try {
          const isListening = await this._web3.eth.net.isListening()
          if (isListening) {
            if (this._web3.utils.isAddress(req.params.addr)) {
              let lpToken = TokenManager.getLPToken(req.params.addr)
              if (lpToken === undefined) {
                lpToken = new LPToken(this._web3, req.params.addr)
                await lpToken.init()
              }
              res.status(200).send(lpToken.infosAsJson());
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

