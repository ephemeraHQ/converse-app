import { useCallback, useEffect, useState } from "react";
import { PixelRatio, TextInput, Dimensions } from "react-native";

import { getProfilesStore, useAccountsList } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { ProfilesStoreType } from "../data/store/profilesStore";

export const shortAddress = (address: string) =>
  address && address.length > 7
    ? `${address.slice(0, 4)}...${address.slice(
        address.length - 4,
        address.length
      )}`
    : address || "";

export const shortDomainMiddle = (domain: string | undefined): string => {
  if (!domain) return "";

  const screenWidth = Dimensions.get("window").width;
  let maxLength = 15;

  // For larger screens
  if (screenWidth > 400) {
    maxLength = 20;
  }

  if (domain.length <= maxLength) {
    return domain;
  }

  const frontChars = Math.ceil(maxLength / 2);
  const backChars = Math.floor(maxLength / 2) - 3;

  return `${domain.slice(0, frontChars)}...${domain.slice(-backChars)}`;
};

export const shortDomainTail = (domain: string | undefined): string => {
  if (!domain) return "";

  const screenWidth = Dimensions.get("window").width;
  let maxLength = 15;

  if (screenWidth > 400) {
    maxLength = 18;
  }

  if (domain.length <= maxLength) {
    return domain;
  }

  return `${domain.slice(0, maxLength - 3)}...`;
};

export const addressPrefix = (address: string) =>
  (address && address.length >= 6 ? address.slice(0, 6) : address) || "";

export const conversationName = (conversation: XmtpConversation) => {
  return (
    conversation.conversationTitle || shortAddress(conversation.peerAddress)
  );
};

export const getTitleFontScale = (): number => {
  let titleFontScale = 1;
  const fontScale = PixelRatio.getFontScale();
  if (fontScale > 1) {
    titleFontScale = Math.min(fontScale, 1.235);
  }
  return titleFontScale;
};

export type TextInputWithValue = TextInput & { currentValue: string };

export const getReadableProfile = (account: string, address: string) => {
  const primaryUserName = getProfilesStore(account)
    .getState()
    .profiles[address]?.socials.userNames?.find((e) => e.isPrimary)?.name;
  const primaryENS = getProfilesStore(account)
    .getState()
    .profiles[address]?.socials.ensNames?.find((e) => e.isPrimary)?.name;
  const primaryUns = getProfilesStore(account)
    .getState()
    .profiles[address]?.socials.unstoppableDomains?.find((e) => e.isPrimary)
    ?.domain;
  return (
    shortDomainTail(primaryUserName) ||
    primaryENS ||
    primaryUns ||
    shortAddress(account)
  );
};

export const useAccountsProfiles = () => {
  const accounts = useAccountsList();
  const [accountsProfiles, setAccountsProfiles] = useState<{
    [account: string]: string;
  }>({});

  const handleAccount = useCallback(
    (account: string, state: ProfilesStoreType) => {
      const primaryUserName = state.profiles[account]?.socials.userNames?.find(
        (e) => e.isPrimary
      )?.name;
      const primaryENS = state.profiles[account]?.socials.ensNames?.find(
        (e) => e.isPrimary
      )?.name;
      const primaryUns = state.profiles[
        account
      ]?.socials.unstoppableDomains?.find((e) => e.isPrimary)?.domain;

      const readableProfile =
        primaryUserName || primaryENS || primaryUns || shortAddress(account);
      if (accountsProfiles[account] !== readableProfile) {
        setAccountsProfiles((s) => ({
          ...s,
          [account]:
            primaryUserName ||
            primaryENS ||
            primaryUns ||
            shortAddress(account),
        }));
      }
    },
    [accountsProfiles]
  );

  useEffect(() => {
    accounts.forEach((account) => {
      const currentState = getProfilesStore(account).getState();
      handleAccount(account, currentState);
      getProfilesStore(account).subscribe((state) => {
        handleAccount(account, currentState);
      });
    });
  }, [accounts, handleAccount]);

  return accountsProfiles;
};
