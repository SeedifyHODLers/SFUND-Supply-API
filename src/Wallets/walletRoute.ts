import {FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest} from 'fastify';
import Web3 from 'web3';
import {ConfigError} from '../ConfigError';
import {PoolManager} from '../Pools/PoolManager';
import {LPToken} from './LPToken';
import {TokenManager} from './TokenManager';
import {Wallet} from './Wallet';
import {initializeWeb3, configure, getChainName} from "../utils";
import fastq from 'fastq';
import NodeCache  from "node-cache";
const config = configure();


let queue = fastq.promise(async (task) => {
    try {
        await task();
    } catch (err) {
        console.error(err);
    }
}, 1);

const cache = new NodeCache();

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

export const walletRoute: FastifyPluginAsync = async (server: FastifyInstance) => {

    server.get('/wallet/:addr', {}, async (req: FastifyRequest<{ Params: { addr: string }; }>, reply: FastifyReply) => {
        await queue.push(async () => {
            console.log(`Fetching wallet for ${req.params.addr}`)
            try {
                if (Web3.utils.isAddress(req.params.addr)) {
                    const cached = cache.get(req.params.addr);
                    if (cached) {
                        console.log('Cache hit')
                        return reply.code(200).send(cached);
                    }

                    // const fetchers = {
                    //   BSC: initializeWeb3(config.bscNodeUrl),
                    //   ETH: initializeWeb3(config.ethNodeUrl),
                    //   ARB: initializeWeb3(config.arbNodeUrl),
                    // }
                    // const isListeningBsc = await fetchers.BSC.eth.net.isListening()
                    // const isListeningEth = await fetchers.ETH.eth.net.isListening()

                    // if (isListeningBsc && isListeningEth)
                    {
                        const dataFetchers = PoolManager.getAll().map(pool => pool.getDataFetcher(pool.web3));

                        const wallet = new Wallet(
                            req.params.addr,
                            dataFetchers
                        )
                        await wallet.initPools()
                        await wallet.fetchInfos()
                        cache.set(req.params.addr, wallet.infosAsJson(), 60 * 5);
                        reply.code(200).send(wallet.infosAsJson())
                        await sleep(1000);
                    }
                } else {
                    throw new Error("Invalid address")
                }
            } catch (e) {
                if (e instanceof ConfigError) {
                    console.log(e);
                    return reply.code(e.code).send({error: "Internal server error"});
                } else if (e instanceof Error) {
                    console.log(e.stack)
                    return reply.code(400).send({error: e.message});
                } else {
                    console.log(e);
                    return reply.code(500)
                }
            }
        })
    })

    server.get('/lp/:addr', {}, async (req: FastifyRequest<{ Params: { addr: string }; }>, reply: FastifyReply) => {
        await queue.push(async () => {
            try {
                const cached = cache.get(`lp-${req.params.addr}`);
                if (cached) {
                    console.log('LP Cache hit')
                    return reply.code(200).send(cached);
                }
                const config = configure();
                let targetConfig;
                switch (req.params.addr) {
                    case process.env.ETH_UNI_LP:
                        targetConfig = config.ethNodeUrl;
                        break;
                    case process.env.ARB_CMLT_LP:
                        targetConfig = config.arbNodeUrl;
                        break;
                    default:
                        targetConfig = config.bscNodeUrl;
                        break;
                }
                const web3 = initializeWeb3(targetConfig)
                if (web3.utils.isAddress(req.params.addr)) {
                    let lpToken = TokenManager.getLPToken(req.params.addr)
                    if (lpToken === undefined) {
                        lpToken = new LPToken(web3, req.params.addr)
                        await lpToken.init()
                    }
                    await lpToken.fetchInfos()
                    cache.set(`lp-${req.params.addr}`, lpToken.infosAsJson(), 60 * 5);
                    return reply.code(200).send(lpToken.infosAsJson());
                } else {
                    throw new Error("Invalid address")
                }
            } catch (e) {
                console.log(e);
                if (e instanceof ConfigError) {
                    return reply.code(e.code).send({error: "Internal server error"});
                } else if (e instanceof Error) {
                    return reply.code(400).send({error: e.message});
                } else {
                    return reply.code(500)
                }
            }
        })
    })
}


