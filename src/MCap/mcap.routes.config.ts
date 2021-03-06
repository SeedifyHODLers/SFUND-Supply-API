import express from 'express';
import Web3 from 'web3';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { ConfigError } from '../ConfigError';
import { MCap } from './MCap';

export class MCapRoutes extends CommonRoutesConfig {
  private _web3: Web3;
  constructor(app: express.Application) {
    super(app, 'MCapRoutes');
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

    this._web3 = new Web3(new Web3.providers.WebsocketProvider("wss://bsc-ws-node.nariox.org:443", options));
  }

  configureRoutes() {
    this.app.route(`/mcap`)
      .get(async (req: express.Request, res: express.Response) => {
        try {
          const isListening = await this._web3.eth.net.isListening()
          if (isListening) {
            const mcap = new MCap(this._web3, "0x477bc8d23c634c154061869478bce96be6045d12");
            await mcap.fetchFromDb()
            res.status(200).send(mcap.infosAsJson());
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

