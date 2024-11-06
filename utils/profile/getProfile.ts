import { type ProfileByAddress } from "@data/store/profilesStore";
import { getCleanAddress } from "@utils/evm/address";

export const getProfile = (
  address: string | undefined,
  profilesByAddress: ProfileByAddress | undefined
) => {
  // We might have stored values in lowercase or formatted, let's check both
  if (!profilesByAddress || !address) return undefined;
  return (
    profilesByAddress[address] ||
    profilesByAddress[getCleanAddress(address)] ||
    profilesByAddress[address.toLowerCase()]
  );
};
