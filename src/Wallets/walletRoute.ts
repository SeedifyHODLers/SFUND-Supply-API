import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import Web3 from 'web3';
import { ConfigError } from '../ConfigError';
import { PoolManager } from '../Pools/PoolManager';
import { LPToken } from './LPToken';
import { TokenManager } from './TokenManager';
import { Wallet } from './Wallet';
import {initializeWeb3, configure} from "../utils";

const config = configure();

export const walletRoute: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/wallet/:addr', {}, async (req: FastifyRequest<{ Params: { addr: string }; }>, reply: FastifyReply) => {
    try {
      if (Web3.utils.isAddress(req.params.addr)) {
          const wallet = new Wallet(
              req.params.addr,
              PoolManager.getAll().map(pool => pool.getDataFetcher(pool.web3))
          )
          await wallet.initPools()
          await wallet.fetchInfos()
          reply.code(200).send(wallet.infosAsJson());
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
      const config = configure();
      let targetConfig;
      switch (req.params.addr) {
        case process.env.ETH_UNI_LP: targetConfig = config.ethNodeUrl; break;
        case process.env.ARB_CMLT_LP: targetConfig = config.arbNodeUrl; break;
        default: targetConfig = config.bscNodeUrl; break;
      }
      const web3 = initializeWeb3(targetConfig)
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


