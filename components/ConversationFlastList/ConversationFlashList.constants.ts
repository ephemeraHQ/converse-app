import { Platform } from "react-native";

// iOS has it's own bounce and search bar, so we need to set a different threshold
// Android does not have a bounce, so this will never really get hit.
export const CONVERSATION_FLASH_LIST_REFRESH_THRESHOLD =
  Platform.OS === "ios" ? -190 : 0;
