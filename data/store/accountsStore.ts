import logger from "@utils/logger";
import { v4 as uuidv4 } from "uuid";
import { create, StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ChatStoreType, initChatStore } from "./chatStore";
import {
  initRecommendationsStore,
  RecommendationsStoreType,
} from "./recommendationsStore";
import {
  GroupStatus,
  initSettingsStore,
  SettingsStoreType,
} from "./settingsStore";
import {
  initTransactionsStore,
  TransactionsStoreType,
} from "./transactionsStore";
import { initWalletStore, WalletStoreType } from "./walletStore";
import { removeLogoutTask } from "@utils/logout";
import mmkv, { zustandMMKVStorage } from "../../utils/mmkv";
import { useLinkWithPasskey } from "@privy-io/expo/dist/passkey";

type AccountStoreType = {
  [K in keyof AccountStoreDataType]: UseBoundStore<
    StoreApi<AccountStoreDataType[K]>
  >;
};

const storesByAccount: {
  [account: string]: AccountStoreType;
} = {};

// And here call the init method of each store
export const initStores = (account: string) => {
  if (!(account in storesByAccount)) {
    logger.debug(`[AccountsStore] Initiating account ${account}`);
    // If adding a persisted store here, please add
    // the deletion method in deleteStores
    storesByAccount[account] = {
      settings: initSettingsStore(account),
      recommendations: initRecommendationsStore(account),
      chat: initChatStore(account),
      wallet: initWalletStore(account),
      transactions: initTransactionsStore(account),
    };
  }
};

const deleteStores = (account: string) => {
  logger.debug(`[AccountsStore] Deleting account ${account}`);
  delete storesByAccount[account];
  mmkv.delete(`store-${account}-chat`);
  mmkv.delete(`store-${account}-recommendations`);
  mmkv.delete(`store-${account}-settings`);
  mmkv.delete(`store-${account}-wallet`);
  mmkv.delete(`store-${account}-transactions`);
};

export const TEMPORARY_ACCOUNT_NAME = "TEMPORARY_ACCOUNT";

initStores(TEMPORARY_ACCOUNT_NAME);

export const getAccountsList = () =>
  useAccountsStore
    .getState()
    .accounts.filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);

export const useAccountsList = () => {
  const accounts = useAccountsStore((s) => s.accounts);
  return accounts.filter((a) => a && a !== TEMPORARY_ACCOUNT_NAME);
};

export const useErroredAccountsMap = () => {
  const accounts = useAccountsList();
  return accounts.reduce(
    (acc, a) => {
      const errored = getChatStore(a).getState().errored;

      if (errored) {
        acc[a] = errored;
      }

      return acc;
    },
    {} as { [account: string]: boolean }
  );
};
// This store is global (i.e. not linked to an account)
// For now we only use a single account so we initialize it
// and don't add a setter.

type AccountsStoreStype = {
  currentAccount: string;
  setCurrentAccount: (account: string, createIfNew: boolean) => void;

  accounts: string[];
  inboxIdToAccountMap: Record<string, string>;

  removeAccount: (account: string) => void;
  databaseId: { [account: string]: string };
  setDatabaseId: (account: string, id: string) => void;
  resetDatabaseId: (account: string) => void;
  privyAccountId: { [account: string]: string | undefined };
  setPrivyAccountId: (account: string, id: string | undefined) => void;
};

/*

xmtp inboxid
https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=3558-9891&t=xylZW8HeRLR4D45G-11
has at least one -> embedded wallet per physical human
can add multiple embedded wallets per inboxid

as far as we care, we will only have one embedded wallet per installation
multip0le embedded wallet, one per inboxid on each installation is possible
it will be considered public the embedded wallet address from inboxid

inbox id

topping up wallet,
- external wallet - i'm going to have to jump out of the app to "sign" transactions to top up

embedded wallet
- we're goingt to utilize passkey security in orderr to protecvt this key material, and
it will be dcerived from passkey material via a service such as turnkey or dynamic - we're leaning heavily
towards turnkey beause as far as we can tell they are the only provier that allows passkey derivation without some external
linked account

smart contract wallet are all the wallets we `'care' abourt right now
https://www.notion.so/ephemerahq/Smart-Contract-Wallet-Work-Refinement-11330823ce9280539056d14fcc4e0de7?pvs=4
https://www.notion.so/ephemerahq/Approvals-in-Converse-0ca3419d992c4acb853654b808a338ff?pvs=4
https://link.excalidraw.com/readonly/WFBJrBWRAz9IOU8COzZi
- decentrazlied manner - provide means of enforcing you have to pay this to reach this aoucc
- we need some explanation of what the hell this is
- we just care right now that we can create / link one


incognito / hide my identity
https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk?node-id=3851-16151#1079417177
- really, this is an ephemeral account musehd together with new ephemeral account per
conversation, perhaps with default behavior like shorter dissappearing windows...
// look into viem package instwead of ehters becvause alex says ethers is slow and big
      const signer = new Wallet(utils.randomPrivateKey());
      await initXmtpClient({
        signer,
        address: await signer.getAddress(),
        isEphemeral: true,
      });


      thinking about the refator4 c at a high level


 crazy thingbs: very difficult if you try to smash incogniuto stuff into store of the other thigns
 one example of somethnign difficul
 // don't think you would be doing any payments
 you woul;dn't do any passkey stuff
 https://docs.turnkey.com/embedded-wallets/sub-organizations-as-wallets

 account VS xmtp inbox id
 xmtp inbox
 - has all the other shit

 acocunt  -> social media vibes?
 - xmtp inbox-> messenger vibes
 - xmtp inbox i
 - username
 -pholto
 all my ens shit



 applicationAcotr.send { type: command.inbox.create, params: inboxType: incognito }
 \
  forwards to inboxesManagberActor
   \
     cool hey ive got a req1uest to create an account
     if incognito -> skip passkey creationa nd go to state for creating random key material (maybe this is the "embedded wallet" figure out this lanaguae create an index of all this shit too)
     elif normal -> then we go through the flopw of passkey creation, faceid, etc


application actor:
-- inboxes manager acotr
--- holds state aboutr different top level metadata for an inbox:
---- ie: inboxKind: incognito | public
--- one inbox actor per "linked/logged in" inbox
---- each of those inbox actors will handle setting up listeners, loading messages, syncing mesages, reactions, etc
---- embedded wallet state
---- smart contgract wallet state
----- external wallet metadata and stuff we need to sign txs etc


estimaes:
stages:

1:
replaced account string (ethereum account address string) with inbox id evberywher
persist inboxId -> account string (with which we initiated xmtp client)
January 12 up for review
fix in non backwards compat way backend when it breks expecting accounts
January 19
work im not super familiar with database trablwes, etc backend crap
targetting 27 jan to merge
reasoning for estimates: inbox / account touches everything and it isn't tested so it will be hard to track/fix everything that breaks
alex and i will be working on the same area (passkey  + identity) so time to handle conflicts and cooperation/paringinm

2.
remove temperatory account name and replace with more reasonable (no account linked) behavior
handle any quirks of zustand stores not having reaonsble data / currentAccount undefined
compledte lgues pr up by 30th


3. xstate actor model for application, inboxes manager actor, lifecycle event handling, testability, dependency control
a la group join refactor
 3.1 - todo come up with these and estimates
 3.2

---- no significant functionality added until here ----
alex and i hold hands here

incognito identity

 */

export const useAccountsStore = create<AccountsStoreStype>()(
  persist(
    (set) => ({
      currentAccount: TEMPORARY_ACCOUNT_NAME,
      accounts: [TEMPORARY_ACCOUNT_NAME],
      privyAccountId: {},
      setPrivyAccountId: (account, id) =>
        set((state) => {
          const privyAccountId = { ...state.privyAccountId };
          privyAccountId[account] = id;
          return { privyAccountId };
        }),
      databaseId: {},
      setDatabaseId: (account, id) =>
        set((state) => {
          const databaseId = { ...state.databaseId };
          databaseId[account] = id;
          return { databaseId };
        }),
      resetDatabaseId: (account) =>
        set((state) => {
          const databaseId = { ...state.databaseId };
          databaseId[account] = uuidv4();
          return { databaseId };
        }),
      setCurrentAccount: (account, createIfNew) =>
        set((state) => {
          if (state.currentAccount === account) return state;
          const accounts = [...state.accounts];
          const isNew = !accounts.includes(account);

          if (isNew && !createIfNew) {
            logger.warn(
              `[AccountsStore] Account ${account} is new but createIfNew is false`
            );
            return state;
          }

          logger.debug(`[AccountsStore] Setting current account: ${account}`);

          if (!storesByAccount[account]) {
            initStores(account);
          }

          const databaseId = { ...state.databaseId };

          if (isNew) {
            accounts.push(account);
            databaseId[account] = uuidv4();
            removeLogoutTask(account);
            // Init lastAsyncUpdate so no async migration is run for new accounts
            // getSettingsStore(account)
            //   .getState()
            //   .setLastAsyncUpdate(updateSteps.length);
            return {
              // No setting anymore because we want to refresh profile first
              // currentAccount: account,
              accounts,
              databaseId,
            };
          }

          return {
            currentAccount: account,
            accounts,
            databaseId,
          };
        }),
      removeAccount: (accountToRemove) =>
        set((state) => {
          const newAccounts = [
            ...state.accounts.filter((a) => a !== accountToRemove),
          ];

          if (newAccounts.length === 0) {
            newAccounts.push(TEMPORARY_ACCOUNT_NAME);
          }

          const newDatabaseId = { ...state.databaseId };
          delete newDatabaseId[accountToRemove];
          deleteStores(accountToRemove);
          return {
            accounts: newAccounts,
            databaseId: newDatabaseId,
          };
        }),
    }),
    {
      name: "store-accounts",
      storage: createJSONStorage(() => zustandMMKVStorage),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            logger.warn("An error happened during hydration", error);
          } else {
            if (state?.accounts && state.accounts.length > 0) {
              logger.debug("Accounts found in hydration, initializing stores");
              state.accounts.map(initStores);
            } else if (state) {
              logger.debug(
                "No accounts found in hydration, initializing temporary account"
              );
              state.currentAccount = TEMPORARY_ACCOUNT_NAME;
              state.accounts = [TEMPORARY_ACCOUNT_NAME];
            }
          }
        };
      },
    }
  )
);

// Each account gets multiple substores! Here we define the substore types and
// getters / setters / helpers to manage these multiple stores for each account

// Add here the type of each store data
type AccountStoreDataType = {
  settings: SettingsStoreType;
  recommendations: RecommendationsStoreType;
  chat: ChatStoreType;
  wallet: WalletStoreType;
  transactions: TransactionsStoreType;
};

const getAccountStore = (account: string) => {
  if (account in storesByAccount) {
    return storesByAccount[account];
  } else {
    return storesByAccount[TEMPORARY_ACCOUNT_NAME];
  }
};

export const currentAccount = (): string =>
  (useAccountsStore.getState() as AccountsStoreStype).currentAccount;

//
/**
 * TODO: determine if this is the way we want to transition to imperatively
 * calling our Zustand store.
 * TODO: move this to a different file
 *
 * It isn't very ergonomic and mocking things seems a little difficult.
 *
 * We might want to look into creating a subscription to our stores and a
 * behavior subject by which to observe it across the app.
 *
 * Set the group status for the current account
 * @param groupStatus The group status to set
 */
export const setGroupStatus = (groupStatus: GroupStatus) => {
  const account = currentAccount();
  if (!account) {
    logger.warn("[setGroupStatus] No current account");
    return;
  }
  const setGroupStatus = getSettingsStore(account).getState().setGroupStatus;
  setGroupStatus(groupStatus);
};

// we'll be able to create a subscription to our stores and a behavior subject
// by which to observe it across the app
// We'll seed the behaviorsubject with the getState.value api
// export const _currentAccount = () => useAccountsStore.subscribe((s) => s.);
export const useCurrentAccount = () => {
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  return currentAccount === TEMPORARY_ACCOUNT_NAME ? undefined : currentAccount;
};

export function getCurrentAccount() {
  const currentAccount = useAccountsStore.getState().currentAccount;
  return currentAccount === TEMPORARY_ACCOUNT_NAME ? undefined : currentAccount;
}

export const loggedWithPrivy = () => {
  const account = currentAccount();
  return isPrivyAccount(account);
};

export const isPrivyAccount = (account: string) => {
  return !!useAccountsStore.getState().privyAccountId[account];
};

export const useLoggedWithPrivy = () => {
  const account = useCurrentAccount();
  const privyAccountId = useAccountsStore((s) => s.privyAccountId);
  return account ? !!privyAccountId[account] : false;
};

export const useHasOnePrivyAccount = () => {
  const accountsState = useAccountsStore();
  let hasOne = undefined as string | undefined;
  accountsState.accounts.forEach((a) => {
    if (a !== TEMPORARY_ACCOUNT_NAME && accountsState.privyAccountId[a]) {
      hasOne = a;
    }
  });
  return hasOne;
};

// This enables us to use account-based substores for the current selected user automatically,
// Just call export useSubStore = accountStoreHook("subStoreName") in the substore definition

const currentAccountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    // TODO: Rename the hook above to useCurrentAccountStore?
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const currentAccount = useAccountsStore((s) => s.currentAccount);
    const accountStore = getAccountStore(currentAccount);
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[T];

  use.getState = () => {
    const currentAccountState = useAccountsStore.getState();
    const currentAccount = currentAccountState.currentAccount;
    const accountStore = getAccountStore(currentAccount);
    return accountStore[key].getState();
  };

  return use;
};

const accountStoreHook = <T extends keyof AccountStoreDataType>(
  key: T,
  account: string
) => {
  const _useStore = <U>(selector: (state: AccountStoreDataType[T]) => U) => {
    const accountStore = getAccountStore(account);
    return accountStore[key](selector);
  };

  const use = _useStore as AccountStoreType[T];

  use.getState = () => {
    const accountStore = getAccountStore(account);
    return accountStore[key].getState();
  };

  return use;
};

export const useSettingsStore = currentAccountStoreHook("settings");
export const useSettingsStoreForAccount = (account: string) =>
  accountStoreHook("settings", account);
export const getSettingsStore = (account: string) =>
  getAccountStore(account).settings;

export const useRecommendationsStore =
  currentAccountStoreHook("recommendations");
export const useRecommendationsStoreForAccount = (account: string) =>
  accountStoreHook("recommendations", account);
export const getRecommendationsStore = (account: string) =>
  getAccountStore(account).recommendations;

export const useChatStore = currentAccountStoreHook("chat");
export const useChatStoreForAccount = (account: string) =>
  accountStoreHook("chat", account);
export const getChatStore = (account: string) => getAccountStore(account).chat;

export const useWalletStore = currentAccountStoreHook("wallet");
export const useWalletStoreForAccount = (account: string) =>
  accountStoreHook("wallet", account);
export const getWalletStore = (account: string) =>
  getAccountStore(account).wallet;

export const useTransactionsStore = currentAccountStoreHook("transactions");
export const useTransactionsStoreForAccount = (account: string) =>
  accountStoreHook("transactions", account);
export const getTransactionsStore = (account: string) =>
  getAccountStore(account).transactions;
