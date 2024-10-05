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
    Controlled.joinGroupClient = JoinGroupClient.fixture();

    const input = { groupInviteId: "valid-invite-id" };
    const joinGroupActor = createActor(joinGroupMachineLogic, {
      input,
    }).start();
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
  });
});
