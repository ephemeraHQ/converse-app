import { useCallback, useEffect, useRef, useState } from "react";
import { PixelRatio, TextInput, Dimensions, Platform } from "react-native";

import { getProfilesStore, useAccountsList } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { ProfilesStoreType } from "../data/store/profilesStore";
import { getPreferredName } from "./profile";

const { humanize } = require("../vendor/humanhash");

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

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

export const addressPrefix = (address: string) =>
  (address && address.length >= 6 ? address.slice(0, 6) : address) || "";

export const conversationName = (conversation: XmtpConversation) => {
  const defaultName = conversation.isGroup
    ? capitalize(humanize(conversation.topic.slice(14, 46), 3, " "))
    : shortAddress(conversation.peerAddress);
  return conversation.conversationTitle || defaultName;
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
  const socials =
    getProfilesStore(account).getState().profiles[address]?.socials;
  return getPreferredName(socials, address);
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
      try {
        const currentState = getProfilesStore(account).getState();
        handleAccount(account, currentState);
        getProfilesStore(account).subscribe((state) => {
          handleAccount(account, state);
        });
      } catch (e) {
        console.error(e);
      }
    });
  }, [accounts, handleAccount]);

  return accountsProfiles;
};

export const strByteSize = (str: string) => new Blob([str]).size;

export const useLoopTxt = (
  intervalMs: number,
  options: string[],
  active: boolean
) => {
  const [step, setStep] = useState(0);
  const interval = useRef<NodeJS.Timer | undefined>();
  const startInterval = useCallback(() => {
    if (interval.current) return;
    setStep(0);
    interval.current = setInterval(() => {
      setStep((s) => s + 1);
    }, intervalMs);
  }, [intervalMs]);

  const stopInterval = useCallback(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = undefined;
    }
  }, []);

  useEffect(() => {
    return stopInterval;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active) {
      startInterval();
    } else {
      stopInterval();
    }
  }, [active, startInterval, stopInterval]);
  return options[step % options.length];
};
