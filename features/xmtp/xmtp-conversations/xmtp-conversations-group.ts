import { InboxId } from "@xmtp/react-native-sdk"
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet"
import { IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service"

const defaultPermissionPolicySet: PermissionPolicySet = {
  addMemberPolicy: "allow",
  removeMemberPolicy: "admin",
  addAdminPolicy: "superAdmin",
  removeAdminPolicy: "superAdmin",
  updateGroupNamePolicy: "allow",
  updateGroupDescriptionPolicy: "allow",
  updateGroupImagePolicy: "allow",
  updateMessageDisappearingPolicy: "allow",
}

export async function createXmtpGroup(args: {
  account: string
  inboxIds: InboxId[]
  permissionPolicySet?: PermissionPolicySet
  groupName?: string
  groupPhoto?: string
  groupDescription?: string
}) {
  try {
    const {
      account,
      inboxIds,
      permissionPolicySet = defaultPermissionPolicySet,
      groupName,
      groupPhoto,
      groupDescription,
    } = args

    const startTime = Date.now()

    const client = await getXmtpClientByEthAddress({
      ethAddress: account,
    })

    const group = await client.conversations.newGroupCustomPermissionsWithInboxIds(
      inboxIds,
      permissionPolicySet,
      {
        name: groupName,
        imageUrlSquare: groupPhoto,
        description: groupDescription,
      },
    )

    const duration = Date.now() - startTime

    if (duration > 3000) {
      captureError(new Error(`Creating group took ${duration}ms`))
    }

    return group
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to create XMTP group",
    })
  }
}

export async function addGroupMembers(args: { group: IXmtpGroupWithCodecs; inboxIds: InboxId[] }) {
  try {
    const { group, inboxIds } = args

    const startTime = Date.now()
    await group.addMembersByInboxId(inboxIds)
    const duration = Date.now() - startTime

    if (duration > 3000) {
      captureError(new Error(`Adding group members took ${duration}ms`))
    }
  } catch (error) {
    captureError(error)
    throw new XMTPError({
      error,
      additionalMessage: "failed to add group members",
    })
  }
}
