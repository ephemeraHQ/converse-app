import * as Contacts from "expo-contacts";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { useCurrentAccount } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { postAddressBook } from "./api";

export type AddressBookPermissionStatus = "granted" | "undetermined" | "denied";

const getAddressBookPermissionStatus = async (): Promise<
  AddressBookPermissionStatus | undefined
> => {
  const { status } = await Contacts.requestPermissionsAsync();
  return status;
};

export const saveAddressBookPermissionsStatus = async () => {
  const addressBookStatus = await getAddressBookPermissionStatus();
  if (
    addressBookStatus === "undetermined" ||
    addressBookStatus === "granted" ||
    addressBookStatus === "denied"
  ) {
    useAppStore.getState().setAddressBookPermissionStatus(addressBookStatus);
  }
  return addressBookStatus;
};

// @todo => handle multiple accounts
let lastUpdate = 0;

export const useAddressBookStateHandler = () => {
  const appState = useRef(AppState.currentState);
  const addressBookPermissionStatus = useAppStore(
    (s) => s.addressBookPermissionStatus
  );
  const previousPermissionStatus = useRef(addressBookPermissionStatus);
  // @todo => handle multiple accounts
  const currentAccount = useCurrentAccount();
  const stateHasBeenActiveOnce = useRef(false);
  useEffect(() => {
    // Things to do when app opens
    saveAddressBookPermissionsStatus();
    // Things to do when app status changes (does NOT include first load)
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          nextAppState === "active" &&
          appState.current.match(/inactive|background/)
        ) {
          const hadBeenActiveOnce = stateHasBeenActiveOnce.current;
          stateHasBeenActiveOnce.current = true;
          const permission = await saveAddressBookPermissionsStatus();
          const timeSpent = new Date().getTime() - lastUpdate;
          if (
            timeSpent >= 86400000 &&
            currentAccount &&
            permission === "granted" &&
            hadBeenActiveOnce
          ) {
            shareAddressBook(currentAccount);
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [currentAccount]);
  useEffect(() => {
    // On load, status changes immediatly from undetermined to real status
    // so no need to call also on load
    if (
      addressBookPermissionStatus === "granted" &&
      previousPermissionStatus.current !== "granted" &&
      currentAccount
    ) {
      shareAddressBook(currentAccount);
    }
    previousPermissionStatus.current = addressBookPermissionStatus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressBookPermissionStatus]);
};

export const requestAddressBookPermissions = async (): Promise<
  AddressBookPermissionStatus | undefined
> => {
  const { status: existingStatus } = await Contacts.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Contacts.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus;
};

export const shareAddressBook = async (account: string) => {
  const { data } = await Contacts.getContactsAsync({
    fields: [
      Contacts.Fields.Addresses,
      Contacts.Fields.Emails,
      Contacts.Fields.FirstName,
      Contacts.Fields.LastName,
      Contacts.Fields.PhoneNumbers,
      Contacts.Fields.SocialProfiles,
    ],
  });
  await postAddressBook(account, data);
  lastUpdate = new Date().getTime();
};
