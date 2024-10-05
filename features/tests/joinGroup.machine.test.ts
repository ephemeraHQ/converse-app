import { createActor } from "xstate";

import { joinGroupMachineLogic } from "../GroupInvites/joinGroup.machine";

describe.only("joinGroupMachine", () => {
  it("should reach 'Join Successful' when invite is valid and join is accepted", async () => {
    const input = { groupInviteId: "valid-invite-id" };
    const joinGroupActor = createActor(joinGroupMachineLogic, {
      input,
    }).start();
    expect(joinGroupActor.getSnapshot().value).toBe(
      "Loading Group Invite Metadata"
    );
  });
});
