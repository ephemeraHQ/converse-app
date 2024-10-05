import { createActor, waitFor } from "xstate";

import { Controlled } from "../../dependencies/Environment/Environment";
import { JoinGroupClient } from "../GroupInvites/GroupInvites.client";
import { joinGroupMachineLogic } from "../GroupInvites/joinGroup.machine";

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
  it("Should Successfully allow user to join valid group invite", async () => {
    const navigateToGroupScreenSpy = jest.fn();
    Controlled.joinGroupClient = JoinGroupClient.fixture();

    const input = { groupInviteId: "valid-invite-id" };
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
    expect(joinGroupActor.getSnapshot().value).toBe(
      "Loading Group Invite Metadata"
    );
    await waitFor(joinGroupActor, (state) =>
      state.matches("Waiting For User Action")
    );

    joinGroupActor.send({ type: "user.didTapJoinGroup" });
    expect(joinGroupActor.getSnapshot().value).toBe("Attempting to Join Group");

    await waitFor(joinGroupActor, (state) =>
      state.matches("User Joined Group")
    );

    expect(joinGroupActor.getSnapshot().value).toBe("User Joined Group");

    // this is gross and long and doesn't work i just want to check that
    // the navigateToGroupScreenSpy is called with the correct groupId
    // (groupid123) in this case......
    expect(navigateToGroupScreenSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          account: "0x123",
          groupInviteId: "valid-invite-id",
          groupInviteMetadata: expect.objectContaining({
            createdByAddress: "0x123",
            description: "Group Description",
            groupId: "groupId123",
            groupName: "Group Name from valid-invite-id",
            id: "groupInviteId123",
            imageUrl: "https://www.google.com",
            inviteLink: "https://www.google.com",
          }),
        }),
        event: expect.objectContaining({
          actorId: "0.joinGroupMachine.Attempting to Join Group",
          output: expect.objectContaining({
            groupId: "groupId123",
            type: "group-join-request.accepted",
          }),
          type: "xstate.done.actor.0.joinGroupMachine.Attempting to Join Group",
        }),
        self: expect.objectContaining({
          id: "x:0",
          xstate$$type: 1,
        }),
        system: expect.any(Object),
      })
    );
    expect(navigateToGroupScreenSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: "groupId123",
      })
    );
  });
});
