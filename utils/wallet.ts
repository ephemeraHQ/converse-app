import config from "../config";
import { getAccountsList, getWalletStore } from "../data/store/accountsStore";
import { getErc20BalanceForAddress } from "./evm/erc20";
import provider from "./evm/provider";

let lastRefresh = 0;

export const refreshBalanceForAccount = async (account: string) => {
  const balance = await getErc20BalanceForAddress(
    config.evm.USDC.contractAddress,
    account,
    provider
  );
  getWalletStore(account).getState().setUSDCBalance(balance);
  console.log(`Got USDC Balance for ${account}: ${balance}`);
};

export const refreshBalanceForAccounts = async () => {
  const now = new Date().getTime();
  if (now - lastRefresh < 2000) return;
  lastRefresh = now;
  const accounts = getAccountsList();
  await Promise.all(accounts.map(refreshBalanceForAccount));
};
