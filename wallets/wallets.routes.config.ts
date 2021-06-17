import express from 'express';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { ConfigError } from '../ConfigError';
import { Wallet } from './wallet';

export class WalletsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'WalletsRoutes');
  }

  configureRoutes() {

    this.app.route(`/wallet/:addr`)
      .get((req: express.Request, res: express.Response) => {
        try {
          const wallet = new Wallet(req.params.addr, req.headers.tk);
          wallet.getWalletInfos().then(() => res.status(200).send(wallet.getInfos())).catch((e) => res.status(400).send({ error: e.message }));
        }
        catch (e) {
          if (e instanceof ConfigError) {
            res.status(e.code).send({ error: "Internal server error" });
          }
          else {
            console.log(e.message);
            res.status(400).send({ error: e.message });
          }
        }
      })

    return this.app;
  }

}