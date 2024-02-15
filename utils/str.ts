import { useCallback, useEffect, useState } from "react";
import { PixelRatio, TextInput, Dimensions, Platform } from "react-native";

import { getProfilesStore, useAccountsList } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { ProfilesStoreType } from "../data/store/profilesStore";
import { getPreferredName } from "./profile";

export const shortAddress = (address: string) =>
  address && address.length > 7
    ? `${address.slice(0, 4)}...${address.slice(
        address.length - 4,
        address.length
      )}`
    : address || "";

export const shortDomain = (domain: string | undefined): string => {
  if (!domain) return "";
  if (Platform.OS === "web") return domain;

  const screenWidth = Dimensions.get("window").width;
  let maxLength;

  if (screenWidth > 800) {
    // For iPad and mac app
    maxLength = 30;
  } else if (screenWidth > 400) {
    // For iPhone Plus and Pro Max
    maxLength = 15;
  } else {
    // For iPhone Mini, iPhone, and iPhone Pro
    maxLength = 12;
  }

  return domain.length > maxLength
    ? `${domain.slice(0, maxLength)}...`
    : domain;
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

export const getReadableProfile = (
  account: string,
  address: string,
  showFullUsername: boolean = false
) => {
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
    (showFullUsername ? primaryUserName : shortDomain(primaryUserName)) ||
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
      const socials = state.profiles[account]?.socials;
      const readableProfile = getPreferredName(socials, account);

      if (accountsProfiles[account] !== readableProfile) {
        setAccountsProfiles((s) => ({
          ...s,
          [account]: readableProfile,
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
