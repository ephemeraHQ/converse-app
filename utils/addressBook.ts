import * as Contacts from "expo-contacts";
import { CountryCode } from "libphonenumber-js";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as RNLocalize from "react-native-localize";

import { postAddressBook } from "./api";
import { getDeviceId } from "./keychain/helpers";
import { refreshRecommendationsForAccount } from "./recommendations";
import { useCurrentAccount } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";

export type AddressBookPermissionStatus = "granted" | "undetermined" | "denied";

const getAddressBookPermissionStatus = async (): Promise<
  AddressBookPermissionStatus | undefined
> => {
  const { status } = await Contacts.getPermissionsAsync();
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
    // On load, share address book
    if (previousPermissionStatus.current === "granted" && currentAccount) {
      shareAddressBook(currentAccount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (
      addressBookPermissionStatus === "granted" &&
      previousPermissionStatus.current !== "granted" &&
      currentAccount
    ) {
      shareAddressBook(currentAccount).then(() => {
        refreshRecommendationsForAccount(currentAccount);
      });
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
  const phoneCountryCode = RNLocalize.getCountry() as CountryCode;
  const deviceId = await getDeviceId();
  await postAddressBook(account, {
    deviceId,
    countryCode: phoneCountryCode,
    contacts: data,
  });
  lastUpdate = new Date().getTime();
};
