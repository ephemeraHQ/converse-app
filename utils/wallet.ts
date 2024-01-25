import config from "../config";
import { getAccountsList, getWalletStore } from "../data/store/accountsStore";
import { getErc20BalanceForAddress } from "./evm/erc20";
import provider from "./evm/provider";

const lastRefreshByAccount: { [account: string]: number } = {};

export const refreshBalanceForAccount = async (
  account: string,
  delayMs = 0
) => {
  const lastRefresh = lastRefreshByAccount[account] || 0;
  const now = new Date().getTime();
  if (now - lastRefresh < delayMs) {
    console.log(
      `Balance for ${account} already refreshed less than ${
        delayMs / 1000
      } s ago`
    );
    return;
  }
  const balance = await getErc20BalanceForAddress(
    config.evm.USDC.contractAddress,
    account,
    provider
  );
  lastRefreshByAccount[account] = now;
  getWalletStore(account).getState().setUSDCBalance(balance);
  console.log(`Got USDC Balance for ${account}: ${balance}`);
};

export const refreshBalanceForAccounts = async (delayMs = 0) => {
  const accounts = getAccountsList();
  await Promise.all(
    accounts.map((account) => refreshBalanceForAccount(account, delayMs))
  );
};
