// import { ethers } from "ethers"
// import { isAddress } from "ethers/lib/utils"
// import { config } from "../../config"
// import erc20abi from "./abis/erc20.json"
// import { evmHelpers } from "./helpers"
// import provider from "./provider"

// export const TransferWithAuthorizationTypes = {
//   TransferWithAuthorization: [
//     { name: "from", type: "address" },
//     { name: "to", type: "address" },
//     { name: "value", type: "uint256" },
//     { name: "validAfter", type: "uint256" },
//     { name: "validBefore", type: "uint256" },
//     { name: "nonce", type: "bytes32" },
//   ],
// }

// export async function getErc20BalanceForAddress(
//   erc20ContractAddress: string,
//   address: string,
//   provider: ethers.providers.Provider,
// ) {
//   if (!isAddress(address)) {
//     return "0"
//   }
//   const contract = new ethers.Contract(erc20ContractAddress, erc20abi, provider)
//   const balance = await contract.balanceOf(address)
//   return evmHelpers.hexToNumberString(balance)
// }

// /**
//  * Yiels the decimals for en ERC20 contract
//  * @param {*} erc20ContractAddress
//  * @param {*} provider
//  */
// export async function getErc20Decimals(
//   erc20ContractAddress: string,
//   provider: ethers.providers.Provider,
// ) {
//   if (erc20ContractAddress.toLowerCase() === config.evm.USDC.contractAddress.toLowerCase()) {
//     return config.evm.USDC.decimals
//   }
//   const contract = new ethers.Contract(erc20ContractAddress, erc20abi, provider)
//   let decimals
//   try {
//     decimals = await contract.decimals()
//   } catch (e) {
//     /** Some ERC20 contracts do not have the right decimals method. Defaults to 18 */
//     return 18
//   }
//   return evmHelpers.toNumber(decimals)
// }

// /**
//  * yields the symbole for the ERC20 contract
//  * @param {*} erc20ContractAddress
//  * @param {*} provider
//  */
// export async function getErc20TokenSymbol(
//   erc20ContractAddress: string,
//   provider: ethers.providers.Provider,
// ) {
//   const contract = new ethers.Contract(erc20ContractAddress, erc20abi, provider)
//   let symbol
//   try {
//     symbol = await contract.symbol()
//   } catch (e) {
//     /** Some ERC20 contracts, including DAI do not have the right symbol method. */
//     return null
//   }
//   return symbol
// }

// export type TransferAuthorizationMessage = {
//   from: string
//   to: string
//   value: any
//   validAfter: number
//   validBefore: number
//   nonce: string
// }

// /**
//  * Computes the domain separator for a given ERC20 contract
//  * Note: some contracts may not have `version()` or `name()` implemented correctly.
//  * @param chainId
//  * @param erc20ContractAddress
//  * @param provider
//  * @returns
//  */
// const getDomain = async (
//   chainId: number,
//   erc20ContractAddress: string,
//   provider: ethers.providers.Provider,
// ) => {
//   let version = "1"
//   let name = ""
//   if (erc20ContractAddress.toLowerCase() === config.evm.USDC.contractAddress.toLowerCase()) {
//     // Useful to gain a bit of precious time
//     version = config.evm.USDC.version
//     name = config.evm.USDC.name
//   } else {
//     const contract = new ethers.Contract(erc20ContractAddress, erc20abi, provider)
//     try {
//       version = await contract.version()
//     } catch (error) {
//       console.warn(
//         `We could not retrieve the version of ${erc20ContractAddress} using the version() method. Defaulting to ${version}`,
//       )
//     }
//     name = await contract.name()
//   }

//   // If we want to use Polygon Bridged USDC...
//   // https://ethereum.stackexchange.com/questions/141968/usdc-eip-3009-ethereum-and-polygon-code-mismatches
//   // if (
//   //   chainId === 80001 &&
//   //   erc20ContractAddress.toLowerCase() ===
//   //     config.evm.USDC.contractAddress.toLowerCase()
//   // ) {
//   //   return {
//   //     name,
//   //     version,
//   //     salt: ethers.utils.zeroPad(ethers.utils.arrayify(chainId), 32),
//   //     verifyingContract: ethers.utils.getAddress(erc20ContractAddress),
//   //   };
//   // }
//   return {
//     name,
//     version,
//     chainId,
//     verifyingContract: ethers.utils.getAddress(erc20ContractAddress),
//   }
// }

// export async function signTransferAuthorization(
//   erc20ContractAddress: string,
//   message: TransferAuthorizationMessage,
//   provider: ethers.providers.Provider,
//   signer: ethers.Signer,
// ) {
//   const { chainId } = await provider.getNetwork()
//   const domain = await getDomain(chainId, erc20ContractAddress, provider)
//   // @ts-expect-error Property '_signTypedData' does not exist on type 'Signer'.ts(2339)
//   return signer._signTypedData(domain, TransferWithAuthorizationTypes, message)
// }

// export const getTransferAuthorization = async (
//   erc20ContractAddress: string,
//   amount: string,
//   recipientAddress: string,
//   signer: ethers.Signer,
// ) => {
//   const authorizationMessage = {
//     from: await signer.getAddress(),
//     to: recipientAddress,
//     value: amount,
//     validAfter: 0,
//     validBefore: Math.floor(Date.now() / 1000) + 3600,
//     nonce: evmHelpers.randomHex(32),
//   }
//   const signature = await signTransferAuthorization(
//     erc20ContractAddress,
//     authorizationMessage,
//     provider,
//     signer,
//   )
//   return { message: authorizationMessage, signature }
// }
