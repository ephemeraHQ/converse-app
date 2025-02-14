## SpecStory

## Removing Privy Logout Functionality (1/28/2025, 10:42:17 AM)

_**User**_

remove all the privy logout stuff

---

_**Assistant**_

I'll help remove the Privy-related logout functionality. Here are the necessary changes:

```typescript:utils/logout/index.tsx
// ... existing code ...

interface ILogoutAccountArgs {
  account: string;
  dropLocalDatabase: boolean;
}

export async function logoutAccount({
  account,
  dropLocalDatabase,
}: ILogoutAccountArgs) {
  // Reset navigation state before cleanup
  converseNavigatorRef.current?.dispatch(StackActions.popToTop());

  try {
    // Clean up XMTP client and database
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    await client.dropLocalDatabaseConnection();
    logger.debug("[Logout] Successfully dropped connection to libxmp db");

    if (dropLocalDatabase) {
      await client.deleteLocalDatabase();
      logger.debug("[Logout] Successfully deleted libxmp db");
      await deleteLibXmtpDatabaseForInboxId(client.inboxId);
    }
  } catch (error) {
    logger.warn("[Logout] Could not get XMTP Client while logging out", {
      error,
    });
  }

  // Drop XMTP client and clean up account data
  await dropXmtpClient((await getInboxId(account)) as InstallationId);

  // Clean up all account-related data
  deleteXmtpClient(account);
  deleteSubscribedTopics(account);
  delete secureMmkvByAccount[account];
  delete lastNotifSubscribeByAccount[account];

  // Handle account switching and store cleanup
  useAccountsStore.getState().removeAccount(account);
  const remainingAccounts = getAccountsList();
  const setCurrentAccount = useAccountsStore.getState().setCurrentAccount;

  if (remainingAccounts.length > 0) {
    setCurrentAccount(remainingAccounts[0], false);
  } else {
    setCurrentAccount(TEMPORARY_ACCOUNT_NAME, false);
    setAuthStatus("signedOut");
  }

  // Save logout task for background cleanup
  const pkPath = getWalletStore(account).getState().privateKeyPath;
  let apiHeaders: { [key: string]: string } | undefined;
  try {
    apiHeaders = await getXmtpApiHeaders(account);
  } catch (error) {
    logger.warn("[Logout] Could not get API headers while logging out", {
      error,
    });
  }
  saveLogoutTask(account, apiHeaders, [], pkPath);

  setTimeout(() => {
    executeLogoutTasks();
  }, 500);
}

interface IUseLogoutArgs {
  account: string;
}

export function useLogoutFromConverse({ account }: IUseLogoutArgs) {
  const logout = useCallback(
    async (dropLocalDatabase: boolean) => {
      logoutAccount({
        account,
        dropLocalDatabase,
      });
    },
    [account]
  );
  return logout;
}
```

Changes made:
1. Removed `privyLogout` from `ILogoutAccountArgs` interface
2. Removed `privyLogout` parameter from `logoutAccount` function call
3. Removed Privy-related checks and logout logic from `logoutAccount` function
4. Removed `useDisconnectFromPrivy` hook import and usage in `useLogoutFromConverse`
5. Updated dependencies array in `useCallback` to only include `account`

---



---

