import type { GroupInvite } from "./api-group.types";
import logger from "../../logger";
import { oldApi } from "../api";

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
  const { data } = await oldApi.get(`/api/groups/${groupLinkId}`);
  return data as GroupLink;
};

export const joinGroupFromLink = async (groupLinkId: string) => {
  const { data } = await oldApi.post(`/api/groups/join`, { groupLinkId });
  return data as JoinGroupLinkResult;
};

export const createGroupInvite = async (inputs: {
  groupName: string;
  description?: string;
  imageUrl?: string;
  groupId: string;
}): Promise<CreateGroupInviteResult> => {
  const { data } = await oldApi.post("/api/groupInvite", inputs);
  return data;
};

export const getGroupInvite = async (
  inviteId: string
): Promise<GroupInvite> => {
  const { data } = await oldApi.get(`/api/groupInvite/${inviteId}`);
  return data;
};

export const deleteGroupInvite = async (
  account: string,
  inviteId: string
): Promise<void> => {
  await oldApi.delete(`/api/groupInvite/${inviteId}`);
};

export const createGroupJoinRequest = async (
  account: string,
  inviteId: string
): Promise<Pick<GroupJoinRequest, "id">> => {
  const { data } = await oldApi.post("/api/groupJoinRequest", { inviteId });
  logger.debug("[API] Group join request created", data);
  return data;
};

export const getGroupJoinRequest = async (
  id: string
): Promise<GroupJoinRequest> => {
  const { data } = await oldApi.get(`/api/groupJoinRequest/${id}`);
  return data;
};

export const updateGroupJoinRequestStatus = async (
  id: string,
  status: GroupJoinRequest["status"]
): Promise<Pick<GroupJoinRequest, "status" | "id">> => {
  const { data } = await oldApi.put(`/api/groupJoinRequest/${id}`, { status });
  return data;
};

export const getPendingGroupJoinRequests = async (): Promise<{
  joinRequests: PendingGroupJoinRequest[];
}> => {
  const { data } = await oldApi.get("/api/groupJoinRequest/pending");
  return data;
};

export const putGroupInviteRequest = async ({
  status,
  joinRequestId,
}: {
  status: string;
  joinRequestId: string;
}): Promise<void> => {
  const { data } = await oldApi.put(`/api/groupJoinRequest/${joinRequestId}`, {
    status,
  });
  return data;
};
