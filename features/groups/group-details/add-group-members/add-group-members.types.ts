import { InboxId } from "@xmtp/react-native-sdk"
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api"

export type ISearchResultItemProfile = {
  type: "profile"
  inboxId: InboxId
}

export type ISearchResultItemSocialProfile = {
  type: "socialProfile"
  profile: ISocialProfile
}

export type ISearchResultItemEthAddress = {
  type: "ethAddress"
  address: string
}

export type SearchResultItem =
  | ISearchResultItemProfile
  | ISearchResultItemSocialProfile
  | ISearchResultItemEthAddress

export function searchResultIsProfile(item: SearchResultItem): item is ISearchResultItemProfile {
  return item.type === "profile"
}

export function searchResultIsSocialProfile(
  item: SearchResultItem,
): item is ISearchResultItemSocialProfile {
  return item.type === "socialProfile"
}

export function searchResultIsEthAddress(
  item: SearchResultItem,
): item is ISearchResultItemEthAddress {
  return item.type === "ethAddress"
}
