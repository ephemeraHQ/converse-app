import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { IEthereumAddress } from "@/utils/evm/address"

type ISearchResultItemConvosProfile = {
  type: "profile"
  inboxId: IXmtpInboxId
}

type ISearchResultItemExternalIdentity = {
  type: "externalIdentity"
  address: IEthereumAddress
}

export type SearchResultItem = ISearchResultItemConvosProfile | ISearchResultItemExternalIdentity

export function searchResultIsConvosProfile(
  item: SearchResultItem,
): item is ISearchResultItemConvosProfile {
  return item.type === "profile"
}

export function searchResultIsExternalIdentity(
  item: SearchResultItem,
): item is ISearchResultItemExternalIdentity {
  return item.type === "externalIdentity"
}
