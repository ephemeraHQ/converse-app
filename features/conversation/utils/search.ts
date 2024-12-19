import { getInboxProfileSocialsQueryData } from "@/queries/useInboxProfileSocialsQuery";
import { getPreferredInboxName } from "@/utils/profile";
import type {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import type { InboxId } from "@xmtp/react-native-sdk";

type DmSearchParams = {
  account: string;
  searchQuery: string;
  dm: DmWithCodecsType;
};

export const dmMatchesSearchQuery = async ({
  account,
  searchQuery,
  dm,
}: DmSearchParams): Promise<boolean> => {
  const inboxId = await dm.peerInboxId();
  if (await inboxIdMatchesSearchQuery({ account, searchQuery, inboxId })) {
    return true;
  }
  const members = await dm.members();
  for (const member of members) {
    if (
      addressMatchesSearchQuery({
        searchQuery,
        address: member.addresses[0],
      })
    ) {
      return true;
    }
  }
  return false;
};

type GroupSearchParams = {
  account: string;
  searchQuery: string;
  group: GroupWithCodecsType;
};

export const groupMatchesSearchQuery = async ({
  account,
  searchQuery,
  group,
}: GroupSearchParams): Promise<boolean> => {
  if (group.name.toLowerCase().includes(searchQuery.toLowerCase())) {
    return true;
  }
  const members = await group.members();
  for (const member of members) {
    if (
      await inboxIdMatchesSearchQuery({
        account,
        searchQuery,
        inboxId: member.inboxId,
      })
    ) {
      return true;
    }
    if (
      addressMatchesSearchQuery({
        searchQuery,
        address: member.addresses[0],
      })
    ) {
      return true;
    }
  }
  return false;
};

type InboxIdSearchParams = {
  account: string;
  searchQuery: string;
  inboxId: InboxId;
};

const inboxIdMatchesSearchQuery = async ({
  account,
  searchQuery,
  inboxId,
}: InboxIdSearchParams): Promise<boolean> => {
  if (inboxId.toLowerCase().includes(searchQuery.toLowerCase())) {
    return true;
  }
  const profiles = getInboxProfileSocialsQueryData(account, inboxId);
  if (!profiles) {
    return false;
  }
  const name = getPreferredInboxName(profiles);
  if (name.toLowerCase().includes(searchQuery.toLowerCase())) {
    return true;
  }
  return false;
};

type AddressSearchParams = {
  searchQuery: string;
  address: string;
};

const addressMatchesSearchQuery = ({
  searchQuery,
  address,
}: AddressSearchParams): boolean => {
  if (!address) {
    return false;
  }
  return address.toLowerCase().includes(searchQuery.toLowerCase());
};
