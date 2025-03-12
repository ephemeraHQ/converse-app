import { InboxId } from "@xmtp/react-native-sdk"
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet"
import { config } from "@/config"
import { IXmtpGroupWithCodecs } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client.service"

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
  clientInboxId: InboxId
  inboxIds: InboxId[]
  permissionPolicySet?: PermissionPolicySet
  groupName?: string
  groupPhoto?: string
  groupDescription?: string
}) {
  try {
    const {
      clientInboxId,
      inboxIds,
      permissionPolicySet = defaultPermissionPolicySet,
      groupName,
      groupPhoto,
      groupDescription,
    } = args

    const startTime = Date.now()

    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const group = await client.conversations.newGroupCustomPermissions(
      inboxIds,
      permissionPolicySet,
      {
        name: groupName,
        imageUrl: groupPhoto,
        description: groupDescription,
      },
    )

    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
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

export async function addXmtpGroupMembers(args: {
  group: IXmtpGroupWithCodecs
  inboxIds: InboxId[]
}) {
  try {
    const { group, inboxIds } = args

    const startTime = Date.now()
    await group.addMembers(inboxIds)
    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Adding group members took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to add group members",
    })
  }
}

export async function removeXmtpGroupMembers(args: {
  group: IXmtpGroupWithCodecs
  inboxIds: InboxId[]
}) {
  try {
    const { group, inboxIds } = args

    const startTime = Date.now()

    await group.removeMembers(inboxIds)

    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Removing group members took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to remove group members",
    })
  }
}

export async function updateXmtpGroupDescription(args: {
  group: IXmtpGroupWithCodecs
  description: string
}) {
  const { group, description } = args
  try {
    const startTime = Date.now()
    await group.updateDescription(description)
    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Updating group description took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to update group description",
    })
  }
}

export async function updateXmtpGroupImage(args: {
  group: IXmtpGroupWithCodecs
  imageUrl: string
}) {
  const { group, imageUrl } = args

  try {
    const startTime = Date.now()
    await group.updateImageUrl(imageUrl)
    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Updating group image took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to update group image",
    })
  }
}

export async function updateXmtpGroupName(args: { group: IXmtpGroupWithCodecs; name: string }) {
  const { group, name } = args

  try {
    const startTime = Date.now()
    await group.updateName(name)
    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Updating group name took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to update group name",
    })
  }
}
