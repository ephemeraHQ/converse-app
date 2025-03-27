import { Platform } from "react-native"

// On iOS the list has a bounce, so we need to set a different threshold
// to trigger the refresh.
export const CONVERSATION_LIST_REFRESH_THRESHOLD = Platform.OS === "ios" ? -120 : 0
