// TODO:

// import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";

// export async function getEthAddressForInboxId(args: {
//   inboxId: InboxId;
// }) {

//     const client = await getXmtpClient({
//         address: args.account,
//         inboxId: args.inboxId,
//     });
//     const refreshFromNetwork = true;
//     const inboxStates = await client.inboxStates(refreshFromNetwork, [
//       args.inboxId,
//     ]);
//     const targettedInboxState = inboxStates.find(
//       (inboxState) => inboxState.inboxId === args.inboxId
//     );
//     if (!targettedInboxState) {
//       throw new Error("Inbox state not found");
//     }

//     const ethereumRecoveryAddressForInbox =
//       targettedInboxState.recoveryAddress.toLowerCase();

//     if (!ethereumRecoveryAddressForInbox) {
//       throw new Error(
//         "[inboxIdToAddressesCache] Ethereum recovery address not found"
//       );
//     }

//     inboxIdToAddressesCache.set(
//       args.inboxId.toLowerCase(),
//       ethereumRecoveryAddressForInbox
//     );

//     return ethereumRecoveryAddressForInbox;
//   }
