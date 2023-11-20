// pools.ts
require('dotenv').config()
export const seedifyLockedPoolAddresses: string[] = [
    process.env.NEW_LOCKED_STAKING_270,
    process.env.NEW_LOCKED_STAKING_180,
    process.env.NEW_LOCKED_STAKING_90,
    process.env.NEW_LOCKED_STAKING_30,
    process.env.LOCKED_STAKING_SNFTS_14D,
    process.env.LOCKED_STAKING_SNFTS_30D,
    process.env.LOCKED_STAKING_SNFTS_60D,
    process.env.LOCKED_STAKING_SNFTS_90D,
    process.env.LOCKED_STAKING_SNFTS_180D,
    process.env.LOCKED_STAKING_7D,
    process.env.LOCKED_STAKING_14D,
    process.env.LOCKED_STAKING_30D,
    process.env.LOCKED_STAKING_60D,
    process.env.LOCKED_STAKING_90D,
    process.env.LOCKED_STAKING_180D
].filter(addr => addr !== undefined) as string[]

export const seedifyLockedPoolAddressesETH: string[] = [
    process.env.ETH_LOCKED_STAKING_30,
    process.env.ETH_LOCKED_STAKING_90,
    process.env.ETH_LOCKED_STAKING_180,
    process.env.ETH_LOCKED_STAKING_270
].filter(addr => addr !== undefined) as string[]


export const seedifyLockedFarmPoolAddresses: string[] = [
    process.env.LOCKED_FARM_CAKE_LP_SNFTS,
    process.env.LOCKED_FARM_CAKE_LP
].filter(addr => addr !== undefined) as string[]

export const seedifyLockedFarmPoolAddressesETH: string[] = [
    process.env.ETH_LOCKED_FARM_UNI_LP
].filter(addr => addr !== undefined) as string[]


export const seedifyLockedPoolAddressesARB: string[] = [
    process.env.ARB_LOCKED_STAKING_30,
    process.env.ARB_LOCKED_STAKING_90,
    process.env.ARB_LOCKED_STAKING_180,
    process.env.ARB_LOCKED_STAKING_270
].filter(addr => addr !== undefined) as string[]
export const seedifyLockedFarmPoolAddressesARB: string[] = [
    process.env.ARB_LOCKED_FARM_CMLT_LP
].filter(addr => addr !== undefined) as string[]
