import { humanize } from "@/utils/human-hash";
import { Dimensions } from "react-native";

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
  groupName ||
  capitalize(humanize(topic.slice(14, 46), { numWords: 3, separator: " " }));

export function normalizeString(str: string) {
  return str.toLowerCase().trim();
}
