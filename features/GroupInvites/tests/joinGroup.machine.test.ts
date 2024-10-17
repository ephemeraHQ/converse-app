import { GroupData, GroupsDataEntity } from "@utils/xmtpRN/client.types";
import { InboxId } from "@xmtp/react-native-sdk";
import { createActor, waitFor } from "xstate";

import { Controlled } from "../../../dependencies/Environment/Environment";
import { JoinGroupClient } from "../GroupInvites.client";
import { joinGroupMachineLogic } from "../joinGroup.machine";

jest.setTimeout(1);

describe.only("Joining a Group from an Invite", () => {
  let OriginalCurrent: typeof Controlled;
  beforeEach(() => {
    OriginalCurrent = { ...Controlled };
  });

  afterEach(() => {
    Object.entries(OriginalCurrent).forEach(([key, value]) => {
      // todo fix this any crap
      Controlled[key as keyof typeof Controlled] = value as any;
    });
  });

  it("Should Successfully allow an Invited user to join with a valid group invite", async () => {
    let navigateToGroupPayload: any = null;
    const navigateToGroupScreenSpy = jest.fn((payload) => {
      navigateToGroupPayload = payload;
    });
    Controlled.joinGroupClient = JoinGroupClient.userIsNewToGroup();

    const input = { groupInviteId: "irrelevant", account: "irrelevant" };
    const joinGroupActor = createActor(
      joinGroupMachineLogic.provide({
        actions: {
          navigateToGroupScreen: navigateToGroupScreenSpy,
        },
      }),
      {
        input,
      }
    ).start();

    // Initial state
    expect(joinGroupActor.getSnapshot().value).toBe(
      "Loading Group Invite Metadata"
    );

    // Wait for metadata to load
    await waitFor(joinGroupActor, (state) =>
      state.matches("Waiting For User Action")
    );
    expect(
      joinGroupActor.getSnapshot().context.groupInviteMetadata
    ).toBeDefined();

    // User taps join group
    joinGroupActor.send({ type: "user.didTapJoinGroup" });
    expect(joinGroupActor.getSnapshot().value).toBe("Attempting to Join Group");
    const newlyInvitedGroupId =
      joinGroupActor.getSnapshot().context.groupInviteMetadata!.groupId!;
    console.log(newlyInvitedGroupId);

    Controlled.joinGroupClient.fetchGroupsByAccount = async (
      account: string
    ): Promise<GroupsDataEntity> => {
      const fixtureGroup: GroupData = {
        id: newlyInvitedGroupId,
        createdAt: new Date().getTime(),
        members: [],
        topic: "topic123",
        isGroupActive: true,
        state: "allowed",
        creatorInboxId: "0xabc" as InboxId,
        name: "Group Name",
        addedByInboxId: "0x123" as InboxId,
        imageUrlSquare: "https://www.google.com",
        description: "Group Description",
      } as const;

      const fixtureGroupsDataEntity: GroupsDataEntity = {
        ids: [fixtureGroup.id],
        byId: {
          [fixtureGroup.id]: fixtureGroup,
        },
      } as const;

      return fixtureGroupsDataEntity;
    };
    // Wait for join attempt to complete
    await waitFor(
      joinGroupActor,
      (state) => !state.matches("Attempting to Join Group")
    );
    console.log(joinGroupActor.getSnapshot().value);

    // Wait for join attempt to complete
    await waitFor(joinGroupActor, (state) =>
      state.matches("Determining Newly Joined Group")
    );

    await waitFor(
      joinGroupActor,
      (state) => !state.matches("Determining Newly Joined Group")
    );

    console.log(joinGroupActor.getSnapshot().value);

    // Wait for user consent
    await waitFor(joinGroupActor, (state) =>
      state.matches("Providing User Consent to Join Group")
    );

    // Wait for group refresh
    await waitFor(joinGroupActor, (state) => state.matches("Refreshing Group"));

    // Final state: User Joined Group
    await waitFor(joinGroupActor, (state) =>
      state.matches("User Joined Group")
    );

    expect(navigateToGroupScreenSpy).toHaveBeenCalledTimes(1);
    expect(navigateToGroupPayload.context.groupInviteMetadata.groupId).toBe(
      newlyInvitedGroupId
    );
  });

  it("Should transition to 'User Was Already a Member of Group Prior to Clicking Join Link' if the user has already joined the group before user action", async () => {
    let navigateToGroupPayload: any = null;
    const navigateToGroupScreenSpy = jest.fn((payload) => {
      navigateToGroupPayload = payload;
    });
    Controlled.joinGroupClient = JoinGroupClient.userAlreadyAMemberFixture();

    const input = { groupInviteId: "valid-invite-id", account: "0x123" };
    const joinGroupActor = createActor(
      joinGroupMachineLogic.provide({
        actions: {
          navigateToGroupScreen: navigateToGroupScreenSpy,
        },
      }),
      {
        input,
      }
    ).start();

    // Initial state
    expect(joinGroupActor.getSnapshot().value).toBe(
      "Loading Group Invite Metadata"
    );

    await waitFor(joinGroupActor, (state) =>
      state.matches("Loading Initially Joined Groups")
    );

    await waitFor(joinGroupActor, (state) =>
      state.matches(
        "User Was Already a Member of Group Prior to Clicking Join Link"
      )
    );

    joinGroupActor.send({ type: "user.didTapOpenConversation" });

    expect(navigateToGroupScreenSpy).toHaveBeenCalledTimes(1);
    expect(navigateToGroupPayload.context.groupInviteMetadata.groupId).toBe(
      "groupId123"
    );
  });
});
