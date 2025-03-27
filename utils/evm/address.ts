import { isAddress } from "ethers/lib/utils"

/**
 * Branded type for any Ethereum address
 */
export type IEthereumAddress = string & { readonly __brand: unique symbol }

/**
 * Type guard to check if a string is a valid Ethereum address
 */
export function isEthereumAddress(address: string): address is IEthereumAddress {
  return isAddress(address)
}

/**
 * Branded type specifically for lowercase Ethereum addresses
 */
export type ILowercaseEthereumAddress = IEthereumAddress & { readonly __lowercase: unique symbol }

/**
 * Safely converts a string to a lowercase Ethereum address
 */
export function lowercaseEthAddress(address: IEthereumAddress) {
  if (!isEthereumAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`)
  }
  return address.toLowerCase() as ILowercaseEthereumAddress
}
