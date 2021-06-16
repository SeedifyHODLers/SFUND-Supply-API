import express from 'express';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { Wallet } from './wallet';

export class WalletsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'WalletsRoutes');
  }

  configureRoutes() {

    this.app.route(`/wallet/:addr`)
      .get((req: express.Request, res: express.Response) => {
        try {
          const wallet = new Wallet(req.params.addr);
          wallet.getWalletInfos().then(() => res.status(200).send(wallet.getInfos()))
        }
        catch (e) {
          res.status(400).send({ error: e.message });
        }
      })

    return this.app;
  }

}