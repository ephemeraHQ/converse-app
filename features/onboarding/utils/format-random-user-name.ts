import { v4 } from "uuid";

export const formatRandomUserName = (displayName: string) => {
  const randomUserGuid = v4().replace(/-/g, "").slice(0, 30);
  // Remove all whitespace characters from the display name
  const profileUserName = (
    displayName?.replace(/\s+/g, "") + randomUserGuid
  ).slice(0, 30);
  return profileUserName;
};
