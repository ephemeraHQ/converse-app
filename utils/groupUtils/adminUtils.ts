import { getCleanAddress } from "@utils/evm/address";
import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { EntityObjectWithAddress } from "../../queries/entify";

export const getAccountIsAdmin = (
  members: EntityObjectWithAddress<Member, InboxId> | undefined,
  account: InboxId
) => {
  return (
    members?.byId[account]?.permissionLevel === "admin" ||
    members?.byId[account]?.permissionLevel === "super_admin"
  );
};

export const getAccountIsSuperAdmin = (
  members: EntityObjectWithAddress<Member, InboxId> | undefined,
  account: InboxId
) => {
  return members?.byId[account]?.permissionLevel === "super_admin";
};

export const getAddressIsAdmin = (
  members: EntityObjectWithAddress<Member, InboxId> | undefined,
  address: string
) => {
  const currentId =
    members?.byAddress[address] ||
    members?.byAddress[getCleanAddress(address)] ||
    members?.byAddress[address.toLowerCase()];
  if (!currentId) {
    return false;
  }
  return (
    members?.byId[currentId]?.permissionLevel === "admin" ||
    members?.byId[currentId]?.permissionLevel === "super_admin"
  );
};

export const getAddressIsSuperAdmin = (
  members: EntityObjectWithAddress<Member> | undefined,
  address: string
) => {
  const currentId =
    members?.byAddress[address] ||
    members?.byAddress[getCleanAddress(address)] ||
    members?.byAddress[address.toLowerCase()];
  if (!currentId) {
    return false;
  }
  return members?.byId[currentId]?.permissionLevel === "super_admin";
};
