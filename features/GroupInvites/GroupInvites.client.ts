import { GroupInvite } from "@utils/api.types";
import { AxiosInstance } from "axios";

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

  // todo - create a well that imlpicitly uses the query client..... think about why that could be a poor decision
  constructor(
    fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>
  ) {
    this.fetchGroupInvite = fetchGroupInvite;
  }

  static live({ api }: { api: AxiosInstance }): JoinGroupClient {
    const liveGetGroupInvite = async (groupInviteId: string) => {
      const { data } = await api.get(`/api/groupInvite/${groupInviteId}`);
      return data as GroupInvite;
    };

    return new JoinGroupClient(liveGetGroupInvite);
  }

  static mock(
    fetchGroupInvite: (groupInviteId: string) => Promise<GroupInvite>
  ): JoinGroupClient {
    return new JoinGroupClient(fetchGroupInvite);
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

    return new JoinGroupClient(fixtureGetGroupInvite);
  }

  /**
   * Creates a JoinGroupClient that throws an error when used.
   * This is useful for ensuring that tests explicitly provide implementations,
   * preventing unintended or uncontrolled use of dependencies in tests.
   */
  static unimplemented(): JoinGroupClient {
    return new JoinGroupClient(() => {
      throw new Error(
        "[JoinGroupClient] ERROR: unimplemented - Your code has invoked JoinGroupClient " +
          "without specifying an implementation. This unimplemented dependency is here to " +
          "ensure you don't invoke code you don't intend to, ensuring your tests are truly " +
          "testing what they are expected to"
      );
    });
  }
}
