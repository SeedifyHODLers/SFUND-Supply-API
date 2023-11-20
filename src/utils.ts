// utils.js
import {
    seedifyLockedFarmPoolAddresses,
    seedifyLockedFarmPoolAddressesARB,
    seedifyLockedFarmPoolAddressesETH,
    seedifyLockedPoolAddresses,
    seedifyLockedPoolAddressesARB,
    seedifyLockedPoolAddressesETH
} from "./pools";

require('dotenv').config()
import fastify, {FastifyInstance} from 'fastify';
import querystring from 'querystring';
import {SeedifyLockedStakingPool} from "./Pools/SeedifyLockedStakingPool";
import {SeedifyLockedFarmingPool} from "./Pools/SeedifyLockedFarmingPool";
import Web3 from 'web3';

// Fetch and validate all required configuration
export function configure() {
    // Validate required environment variables
    // You might want to throw errors if required variables are not set
    const defaultBscNodeUrl = 'https://bsc-dataseed1.binance.org:443';
    const defaultEthNodeUrl = 'https://ethereum.publicnode.com:443';
    const defaultArbNodeUrl = 'https://arb1.arbitrum.io/rpc';
    return {
        port: process.env.PORT || 3000,
        bscNodeUrl: process.env.BSC_NODE_URL || defaultBscNodeUrl,
        ethNodeUrl: process.env.ETH_NODE_URL || defaultEthNodeUrl,
        arbNodeUrl: process.env.ARB_NODE_URL || defaultArbNodeUrl,
        StakingBSC: seedifyLockedPoolAddresses,
        FarmingBSC: seedifyLockedFarmPoolAddresses,
        StakingETH: seedifyLockedPoolAddressesETH,
        FarmingETH: seedifyLockedFarmPoolAddressesETH,
        StakingARB: seedifyLockedPoolAddressesARB,
        FarmingARB: seedifyLockedFarmPoolAddressesARB,

    };
}

// Initialize Web3 with provider options
export function initializeWeb3(nodeUrl: string) {
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
            delay: 20000, // ms
            onTimeout: false
        }
    };

    return new Web3(new Web3.providers.HttpProvider(nodeUrl, options));
}

// Initialize pools
export async function initializePools<T extends SeedifyLockedStakingPool | SeedifyLockedFarmingPool>(
    web3Instance:Web3, poolAddresses:string[],
    PoolClass: new (web3: Web3, address: string) => T,
    PoolManager : { addPool: (pool: T) => void }
) {
    for (let address of poolAddresses) {
        if (!address) continue;
        const pool = new PoolClass(web3Instance, address);
        await pool.init();
        PoolManager.addPool(pool);
        console.log(`${address} : ok`)
    }
}

// Set up Fastify with CORS and other plugins
export function setupFastify() {
    const app = fastify({ logger: true });

    app.register(require('fastify-cors'), {
        origin: true,
        querystringParser: (str: string) => querystring.parse(str.toLowerCase())
    });

    return app;
}

export async function initializeServer(app:  FastifyInstance, port: number) {
    return new Promise((resolve, reject) => {
        app.listen(port, '0.0.0.0', (err, address) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(`Server listening at ${address}`);
        });
    });
}

export function getChainName(hostAddress: string | number = 56) {
    switch (hostAddress) {
        case process.env.BSC_NODE_URL:
        case 56:
            return 'BSC';
        case process.env.ETH_NODE_URL:
        case 1:
            return 'ETH';
        case process.env.ARB_NODE_URL:
        case 42161:
            return 'ARB';
        default:
            return 'BSC';
    }
}
