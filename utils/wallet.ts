import { Signer } from "ethers";

import config from "../config";
import {
  getAccountsList,
  getWalletStore,
  isPrivyAccount,
} from "../data/store/accountsStore";
import { getErc20BalanceForAddress } from "./evm/erc20";

let lastRefresh = 0;

export const refreshBalanceForAccounts = async (signer: Signer | undefined) => {
  if (!signer?.provider) return;
  const now = new Date().getTime();
  if (now - lastRefresh < 2000) return;
  lastRefresh = now;
  const accounts = getAccountsList();
  const privyAccount = accounts.find((a) => isPrivyAccount(a));
  if (!privyAccount) return;
  console.log(`Getting USDC Balance for ${privyAccount}...`);
  const balance = await getErc20BalanceForAddress(
    config.evm.USDC.contractAddress,
    privyAccount,
    signer.provider
  );
  getWalletStore(privyAccount).getState().setUSDCBalance(balance);
};
