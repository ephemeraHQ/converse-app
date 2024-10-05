import { createGroupJoinRequest, getGroupJoinRequest } from "@utils/api";
import { GroupInvite } from "@utils/api.types";
import { AxiosInstance } from "axios";

import {
  getInviteJoinRequestId,
  saveInviteJoinRequestId,
} from "./groupInvites.utils";
import { JoinGroupResult } from "./joinGroup.types";

const GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS = 10;
const GROUP_JOIN_REQUEST_POLL_INTERVAL_MS = 1000;

/**
 * TODOs:
 *
 * determine at what point in this client we want to implmeent queryClient
 * options:
 * 1) in base client type so that all flavors behave the same
 * - I'm leaning towards this
 * 2) decided per flavor, so that we can have a live client that uses the query client
 * and a mock client that doesn't
 *
 * Naming Conventions:
 *
 * Fetch: fetches data from the server or over the network somehow
 * Create: creates data on the server or over the network somehow
 * Get:   gets data from some local cache or storage
 * Save:  saves data to some local cache or storage
 */

export class JoinGroupClient {
  fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>;
  attemptToJoinGroup: (
    account: string,
    groupInviteId: string
  ) => Promise<JoinGroupResult>;

  constructor(
    fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>,
    attemptToJoinGroup: (
      account: string,
      groupInviteId: string
    ) => Promise<JoinGroupResult>
  ) {
    this.fetchGroupInvite = fetchGroupInvite;
    this.attemptToJoinGroup = attemptToJoinGroup;
  }

  static live({ api }: { api: AxiosInstance }): JoinGroupClient {
    const liveGetGroupInvite = async (
      groupInviteId: string
    ): Promise<GroupInvite> => {
      const { data } = await api.get(`/api/groupInvite/${groupInviteId}`);
      return data as GroupInvite;
    };

    /**
     * TODO: add sdk polling and race promises
     * @param account
     * @param groupInviteId
     */
    const liveAttemptToJoinGroup = async (
      account: string,
      groupInviteId: string
    ): Promise<JoinGroupResult> => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      let joinRequestId = getInviteJoinRequestId(account, groupInviteId);
      if (!joinRequestId) {
        const joinRequest = await createGroupJoinRequest(
          account,
          groupInviteId
        );
        joinRequestId = joinRequest.id;
        saveInviteJoinRequestId(account, groupInviteId, joinRequestId);
      }

      let attemptsToRetryJoinGroup = 0;
      while (attemptsToRetryJoinGroup < GROUP_JOIN_REQUEST_POLL_MAX_ATTEMPTS) {
        const joinRequestData = await getGroupJoinRequest(joinRequestId);

        if (joinRequestData.status !== "PENDING") {
          switch (joinRequestData.status) {
            case "ACCEPTED":
              return {
                type: "group-join-request.accepted",
                groupId: joinRequestData.groupId as string,
              };
            case "REJECTED":
              return { type: "group-join-request.rejected" };
            case "ERROR":
              return { type: "group-join-request.error" };
          }
        }

        attemptsToRetryJoinGroup += 1;
        await sleep(GROUP_JOIN_REQUEST_POLL_INTERVAL_MS);
      }

      return { type: "group-join-request.timed-out" };
    };

    return new JoinGroupClient(liveGetGroupInvite, liveAttemptToJoinGroup);
  }

  static mock(
    fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>,
    attemptToJoinGroup: (
      account: string,
      groupInviteId: string
    ) => Promise<JoinGroupResult>
  ): JoinGroupClient {
    return new JoinGroupClient(fetchGroupInvite, attemptToJoinGroup);
  }

  static fixture(): JoinGroupClient {
    const fixtureGetGroupInvite = async (groupInviteId: string) => {
      const fixtureGroupInvite: GroupInvite = {
        id: "groupInviteId123",
        inviteLink: "https://www.google.com",
        createdByAddress: "0x123",
        groupName: `Group Name from ${groupInviteId}`,
        imageUrl: "https://www.google.com",
        description: "Group Description",
        groupId: "groupId123",
      } as const;

      return fixtureGroupInvite;
    };

    const fixtureAttemptToJoinGroup = async (
      account: string,
      groupInviteId: string
    ) => {
      return {
        type: "group-join-request.accepted",
        groupId: "groupId123",
      } as const;
    };

    return new JoinGroupClient(
      fixtureGetGroupInvite,
      fixtureAttemptToJoinGroup
    );
  }

  static unimplemented(): JoinGroupClient {
    const unimplementedError = (method: string) => () => {
      const error = `
[JoinGroupClient] ERROR: unimplemented ${method} - Your code has invoked JoinGroupClient 
without specifying an implementation. This unimplemented dependency is here to 
ensure you don't invoke code you don't intend to, ensuring your tests are truly 
testing what they are expected to
`;
      console.warn(error);
      throw new Error(error);
    };

    return new JoinGroupClient(
      unimplementedError("fetchGroupInvite"),
      unimplementedError("attemptToJoinGroup")
    );
  }
}
