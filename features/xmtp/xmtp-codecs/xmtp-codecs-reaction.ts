import { ReactionContent } from "@xmtp/react-native-sdk"

export const getReactionContent = (r: ReactionContent) => (r.schema === "unicode" ? r.content : "?")
