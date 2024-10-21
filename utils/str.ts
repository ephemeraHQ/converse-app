import {
  currentAccount,
  getProfilesStore,
  useAccountsList,
} from "@features/accounts/accounts.store";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, PixelRatio, Platform, TextInput } from "react-native";

import { getLensHandleFromConversationIdAndPeer } from "./lens";
import logger from "./logger";
import { getPreferredName, getProfile } from "./profile";
import { XmtpConversation } from "../data/store/chatStore";
import { ProfileSocials, ProfilesStoreType } from "../data/store/profilesStore";

const { humanize } = require("../vendor/humanhash");

export const shortAddress = (address: string) =>
  address && address.length > 7
    ? `${address.slice(0, 6)}...${address.slice(
        address.length - 4,
        address.length
      )}`
    : address || "";

export const shortDisplayName = (displayName: string | undefined): string => {
  if (!displayName) return "";
  if (Platform.OS === "web") return displayName;

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

  return displayName.length > maxLength
    ? `${displayName.slice(0, maxLength)}...`
    : displayName;
};

export const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

export const addressPrefix = (address: string) =>
  (address && address.length >= 6 ? address.slice(0, 6) : address) || "";

export const conversationName = (
  conversation: XmtpConversation,
  _socials?: ProfileSocials
) => {
  if (conversation.isGroup) {
    return (
      conversation.groupName ||
      capitalize(humanize(conversation.topic.slice(14, 46), 3, " "))
    );
  }

  const socials =
    _socials ||
    getProfile(
      conversation.peerAddress,
      getProfilesStore(currentAccount()).getState().profiles
    )?.socials;

  if (socials) {
    if (conversation.context?.conversationId?.startsWith("lens.dev")) {
      const lensHandle = getLensHandleFromConversationIdAndPeer(
        conversation.context.conversationId,
        socials.lensHandles
      );
      if (lensHandle) {
        return lensHandle;
      }
    }
    const preferredName = getPreferredName(socials, conversation.peerAddress);
    return preferredName;
  }

  const short = shortAddress(conversation.peerAddress);
  return short;
};

export const formatGroupName = (topic: string, groupName?: string) =>
  groupName || capitalize(humanize(topic.slice(14, 46), 3, " "));

export const formatEphemeralUsername = (address: string, username?: string) =>
  username || humanize(address.slice(2, 42), 2, "");

export const formatEphemeralDisplayName = (
  address: string,
  displayName?: string
) => displayName || humanize(address.slice(2, 42), 2, "", true);

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
  const socials = getProfile(
    address,
    getProfilesStore(account).getState().profiles
  )?.socials;
  return getPreferredName(socials, address);
};

export const useAccountsProfiles = () => {
  const accounts = useAccountsList();
  const [accountsProfiles, setAccountsProfiles] = useState<{
    [account: string]: string;
  }>({});

  const handleAccount = useCallback(
    (account: string, state: ProfilesStoreType) => {
      const socials = getProfile(account, state.profiles)?.socials;
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
        logger.error(e);
      }
    });
  }, [accounts, handleAccount]);

  return accountsProfiles;
};

export const strByteSize = (str: string) => new Blob([str]).size;

export const useLoopTxt = (
  intervalMs: number,
  options: string[],
  active: boolean,
  loop: boolean = true
) => {
  const [step, setStep] = useState(0);
  const interval = useRef<NodeJS.Timeout | undefined>();
  const stopInterval = useCallback(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = undefined;
    }
  }, []);

  const startInterval = useCallback(() => {
    if (interval.current) return;
    setStep(0);
    interval.current = setInterval(() => {
      setStep((s) => {
        if (!loop && s === options.length - 1) {
          stopInterval();
          return s;
        }
        return s + 1;
      });
    }, intervalMs);
  }, [intervalMs, loop, stopInterval, options.length]);

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
