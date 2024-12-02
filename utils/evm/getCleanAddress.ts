import { isAddress, getAddress } from "ethers/lib/utils";

export const getCleanAddress = (address: string) => {
  const lowercased = address.toLowerCase();
  if (isAddress(lowercased)) {
    return getAddress(lowercased);
  }
  return address;
};
