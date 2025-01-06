import { currentAccount } from "@data/store/accountsStore";

/**
 * Checks if the provided address belongs to the current user
 * @param address Ethereum address to check
 * @returns boolean indicating if the address belongs to the current user
 */
export function isCurrentUser(address: string): boolean {
  if (!address) return false;
  return address.toLowerCase() === getCurrentInboxId().toLowerCase();
}
