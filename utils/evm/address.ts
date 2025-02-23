// export type IEthereumAddress = `0x${string}`;

import { isAddress } from "ethers/lib/utils";

export function isEthereumAddress(address: string): boolean {
  //   if (!address.startsWith("0x")) {
  //     return false;
  //   }
  return isAddress(address);
}
