import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ConfigError } from '../ConfigError';
import { MCap } from './MCap';
import {configure, initializeWeb3} from "../utils";

export const mcapRoute: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/mcap', {}, async (req: FastifyRequest<{ Params: { addr: string }; }>, reply: FastifyReply) => {
    try {
      const config = configure();
      const web3 = initializeWeb3(config.bscNodeUrl)
      const isListening = await web3.eth.net.isListening()
      if (isListening) {
        const mcap = new MCap(web3, "0x477bc8d23c634c154061869478bce96be6045d12");
        await mcap.fetchFromDb()
        return reply.code(200).send(mcap.infosAsJson());

      }
      else {
        throw new ConfigError("Web3 connection not listening")
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
