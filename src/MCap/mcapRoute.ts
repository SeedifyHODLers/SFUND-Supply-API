import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import Web3 from 'web3';
import { ConfigError } from '../ConfigError';
import { MCap } from './MCap';

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


export const mcapRoute: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/mcap', {}, async (req: FastifyRequest<{ Params: { addr: string }; }>, reply: FastifyReply) => {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed1.binance.org:443", options));
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
