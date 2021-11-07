import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import Web3 from 'web3';
import { ConfigError } from '../ConfigError';
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

export const walletRoute: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/wallet/:addr', {}, async (req: FastifyRequest<{ Params: { addr: string }; }>, reply: FastifyReply) => {
    try {
      if (Web3.utils.isAddress(req.params.addr)) {
        const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443", options));
        const isListening = await web3.eth.net.isListening()
        if (isListening) {
          const wallet = new Wallet(req.params.addr, PoolManager.getAll().map(pool => pool.getDataFetcher(web3)))
          await wallet.initPools()
          await wallet.fetchInfos()
          reply.code(200).send(wallet.infosAsJson());
        }
      }
      else {
        throw new Error("Invalid address")
      }
    }
    catch (e) {
      if (e instanceof ConfigError) {
        console.log(e);
        return reply.code(e.code).send({ error: "Internal server error" });
      }
      else if (e instanceof Error) {
        console.log(e.stack)
        return reply.code(400).send({ error: e.message });
      }
      else {
        console.log(e);
        return reply.code(500)
      }
    }
  })

  server.get('/lp/:addr', {}, async (req: FastifyRequest<{ Params: { addr: string }; }>, reply: FastifyReply) => {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443", options));
      if (web3.utils.isAddress(req.params.addr)) {
        let lpToken = TokenManager.getLPToken(req.params.addr)
        if (lpToken === undefined) {
          lpToken = new LPToken(web3, req.params.addr)
          await lpToken.init()
        }
        await lpToken.fetchInfos()
        return reply.code(200).send(lpToken.infosAsJson());
      }
      else {
        throw new Error("Invalid address")
      }
    }
    catch (e) {
      console.log(e);
      if (e instanceof ConfigError) {
        return reply.code(e.code).send({ error: "Internal server error" });
      }
      else if (e instanceof Error) {
        return reply.code(400).send({ error: e.message });
      }
      else {
        return reply.code(500)
      }
    }
  })
}


