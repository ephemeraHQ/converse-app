// // TODO: move out of ConnectViaWallet
// import {
//   arbitrum,
//   avalanche,
//   base,
//   blast,
//   bsc,
//   celo,
//   ethereum,
//   fantom,
//   gnosis,
//   linea,
//   mantaPacific,
//   optimism,
//   polygon,
//   polygonZkEvm,
//   scroll,
//   sepolia,
//   xai,
//   zkSync,
//   zora,
// } from "thirdweb/chains"

// export const DEFAULT_SUPPORTED_CHAINS = [
//   ethereum,
//   base,
//   optimism,
//   polygon,
//   arbitrum,
//   avalanche,
//   blast,
//   zora,
//   sepolia,
//   bsc,
//   fantom,
//   gnosis,
//   celo,
//   zkSync,
//   polygonZkEvm,
//   linea,
//   scroll,
//   mantaPacific,
//   xai,
// ]

// export const CHAIN_BY_ID = DEFAULT_SUPPORTED_CHAINS.reduce(
//   (acc, chain) => {
//     acc[chain.id] = chain
//     return acc
//   },
//   {} as Record<number, (typeof DEFAULT_SUPPORTED_CHAINS)[number]>,
// )
