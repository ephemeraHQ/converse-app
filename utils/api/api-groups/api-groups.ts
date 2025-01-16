import type { GroupInvite } from "./api-group.types";
import logger from "../../logger";
import { getXmtpApiHeaders } from "../auth";
import { api } from "../api";

export type GroupLink = {
  id: string;
  name: string;
  description: string;
};

export type JoinGroupLinkResult =
  | {
      status: "SUCCESS";
      topic: string;
      reason: undefined;
    }
  | {
      status: "DENIED";
      reason: string | undefined;
      topic: undefined;
    }
  | { status: "ERROR"; reason: undefined; topic: undefined };

export type CreateGroupInviteResult = Pick<GroupInvite, "id" | "inviteLink">;

export type GroupJoinRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "ERROR";

export type GroupJoinRequest = {
  id: string;
  status: GroupJoinRequestStatus;
  invitedByAddress: string;
  groupName: string;
  imageUrl?: string;
  description?: string;
  groupId?: string;
};

export type PendingGroupJoinRequest = {
  id: string;
  groupInviteLinkId: string;
  requesterAddress: string;
  status: GroupJoinRequest["status"];
};

export const getGroupLink = async (groupLinkId: string) => {
  const { data } = await api.get(`/api/groups/${groupLinkId}`);
  return data as GroupLink;
};

export const joinGroupFromLink = async (
  userAddress: string,
  groupLinkId: string
) => {
  const { data } = await api.post(
    `/api/groups/join`,
    { groupLinkId },
    {
      headers: await getXmtpApiHeaders(userAddress),
    }
  );
  return data as JoinGroupLinkResult;
};

export const createGroupInvite = async (
  account: string,
  inputs: {
    groupName: string;
    description?: string;
    imageUrl?: string;
    groupId: string;
  }
): Promise<CreateGroupInviteResult> => {
  const { data } = await api.post("/api/groupInvite", inputs, {
    headers: await getXmtpApiHeaders(account),
  });
  return data;
};

export const getGroupInvite = async (
  inviteId: string
): Promise<GroupInvite> => {
  const { data } = await api.get(`/api/groupInvite/${inviteId}`);
  return data;
};

export const deleteGroupInvite = async (
  account: string,
  inviteId: string
): Promise<void> => {
  await api.delete(`/api/groupInvite/${inviteId}`, {
    headers: await getXmtpApiHeaders(account),
  });
};

export const createGroupJoinRequest = async (
  account: string,
  inviteId: string
): Promise<Pick<GroupJoinRequest, "id">> => {
  const { data } = await api.post(
    "/api/groupJoinRequest",
    { inviteId },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  logger.debug("[API] Group join request created", data);
  return data;
};

export const getGroupJoinRequest = async (
  id: string
): Promise<GroupJoinRequest> => {
  const { data } = await api.get(`/api/groupJoinRequest/${id}`);
  return data;
};

export const updateGroupJoinRequestStatus = async (
  account: string,
  id: string,
  status: GroupJoinRequest["status"]
): Promise<Pick<GroupJoinRequest, "status" | "id">> => {
  const { data } = await api.put(
    `/api/groupJoinRequest/${id}`,
    { status },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data;
};

export const getPendingGroupJoinRequests = async (
  account: string
): Promise<{ joinRequests: PendingGroupJoinRequest[] }> => {
  const { data } = await api.get("/api/groupJoinRequest/pending", {
    headers: await getXmtpApiHeaders(account),
  });
  return data;
};

export const putGroupInviteRequest = async ({
  account,
  status,
  joinRequestId,
}: {
  account: string;
  status: string;
  joinRequestId: string;
}): Promise<void> => {
  const { data } = await api.put(
    `/api/groupJoinRequest/${joinRequestId}`,
    { status },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data;
};
