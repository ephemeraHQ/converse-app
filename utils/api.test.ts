test.todo("fix imports, then uncomment");
// import { Client } from "@xmtp/xmtp-js";
//
// import {
//   createGroupInvite,
//   createGroupJoinRequest,
//   getGroupInvite,
//   getGroupJoinRequest,
//   getPendingGroupJoinRequests,
//   updateGroupJoinRequestStatus,
// } from "./api";
// import { randomClient } from "./test/xmtp";
//
// jest.mock("./keychain", () => {
//   const data: Record<string, string> = {};
//
//   return {
//     setSecureItemAsync(key: string, value: string) {
//       data[key] = value;
//       Promise.resolve();
//     },
//     getSecureItemAsync(key: string) {
//       return Promise.resolve(data[key] ?? null);
//     },
//     deleteSecureItemAsync(key: string) {
//       delete data[key];
//       return Promise.resolve();
//     },
//   };
// });
//
// // todo(lustig): incorporate these tests into JoinGroupClient#live
// describe("GroupInviteLink", () => {
//   let client: Client;
//
//   const groupName = "test";
//   const description = "description";
//   const imageUrl = "image";
//   const groupId = "group";
//
//   beforeEach(async () => {
//     client = await randomClient("dev");
//   });
//
//   it("should create a group invite link and read it back", async () => {
//     const groupInviteLink = await createGroupInvite(client.address, {
//       groupName,
//       description,
//       imageUrl,
//       groupId,
//     });
//     expect(groupInviteLink.id).toBeDefined();
//
//     const fromBackend = await getGroupInvite(groupInviteLink.id);
//     expect(fromBackend.groupName).toEqual(groupName);
//     expect(fromBackend.imageUrl).toEqual(imageUrl);
//     expect(fromBackend.id).toEqual(groupInviteLink.id);
//   });
//
//   it("should allow joining a group", async () => {
//     const groupInviteLink = await createGroupInvite(client.address, {
//       groupName,
//       description,
//       imageUrl,
//       groupId,
//     });
//
//     const secondClient = await randomClient("dev");
//     const { id: joinRequestId } = await createGroupJoinRequest(
//       secondClient.address,
//       groupInviteLink.id
//     );
//
//     expect(joinRequestId).toBeDefined();
//     expect(joinRequestId).not.toEqual(groupInviteLink.id);
//
//     // Fetch it back from the network
//     const fetched = await getGroupJoinRequest(joinRequestId);
//     expect(fetched.id).toEqual(joinRequestId);
//     expect(fetched.invitedByAddress).toEqual(client.address.toLowerCase());
//     expect(fetched.status).toEqual("PENDING");
//     expect(fetched.groupName).toEqual(groupName);
//   });
//
//   it("should allow updating a join request", async () => {
//     const groupInviteLink = await createGroupInvite(client.address, {
//       groupName,
//       description,
//       imageUrl,
//       groupId,
//     });
//
//     const secondClient = await randomClient("dev");
//     const { id: joinRequestId } = await createGroupJoinRequest(
//       secondClient.address,
//       groupInviteLink.id
//     );
//
//     const pending = await getPendingGroupJoinRequests(client.address);
//     expect(pending.joinRequests).toHaveLength(1);
//     const joinRequest = pending.joinRequests[0];
//     expect(joinRequest.id).toEqual(joinRequestId);
//     expect(joinRequest.groupInviteLinkId).toEqual(groupInviteLink.id);
//     expect(joinRequest.requesterAddress).toEqual(
//       secondClient.address.toLowerCase()
//     );
//     expect(joinRequest.status).toEqual("PENDING");
//
//     // Set to rejected
//     await updateGroupJoinRequestStatus(
//       client.address,
//       joinRequestId,
//       "REJECTED"
//     );
//     const newPending = await getPendingGroupJoinRequests(client.address);
//     expect(newPending.joinRequests).toHaveLength(0);
//   });
// });
