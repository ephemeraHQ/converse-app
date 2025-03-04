import { isAddress } from "ethers/lib/utils"

// export type IEthereumAddress = `0x${string}`;

export type IEthereumAddress = string // Later: `0x${string}`;

export function isEthereumAddress(address: string): boolean {
  //   if (!address.startsWith("0x")) {
  //     return false;
  //   }
  return isAddress(address)
}
