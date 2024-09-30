import { interpret } from "xstate";
import { joinGroupMachineLogic } from "./joinGroup.machine";

describe("joinGroupMachine", () => {
  it("should reach 'Join Successful' when invite is valid and join is accepted", async () => {
    const input = { groupInviteId: "valid-invite-id" };
    const machine = joinGroupMachineLogic.withInput(input);
    const service = interpret(machine).start();

    service.send("user.didTapJoinGroup");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(service.getSnapshot().matches("Join Successful")).toBe(true);
  });

  it("should reach 'Invalid Invite' when invite is invalid", () => {
    const input = { groupInviteId: "invalid-invite-id" };
    const machine = joinGroupMachineLogic.withInput(input);
    const service = interpret(machine).start();

    expect(service.getSnapshot().matches("Invalid Invite")).toBe(true);
  });

  it("should reach 'Join Rejected' when join request is rejected", async () => {
    const input = { groupInviteId: "valid-invite-id" };
    const machine = joinGroupMachineLogic.withInput(input);
    const service = interpret(machine).start();

    service.send("user.didTapJoinGroup");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(service.getSnapshot().matches("Join Rejected")).toBe(true);
  });
});
