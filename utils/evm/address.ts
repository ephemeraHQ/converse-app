import { isAddress } from "ethers/lib/utils"

export type IEthereumAddress = string & { readonly brand: unique symbol }

export function isEthereumAddress(address: string): address is IEthereumAddress {
  return isAddress(address)
}
