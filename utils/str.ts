import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, PixelRatio, TextInput } from "react-native";

const { humanize } = require("../vendor/humanhash");

export const shortDisplayName = (displayName: string | undefined): string => {
  if (!displayName) return "";

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
