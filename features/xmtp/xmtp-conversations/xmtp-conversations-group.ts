import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import {
  addAdmin,
  addGroupMembers,
  addSuperAdmin,
  removeAdmin,
  removeGroupMembers,
  removeSuperAdmin,
  updateGroupDescription,
  updateGroupImageUrl,
  updateGroupName,
} from "@xmtp/react-native-sdk"
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet"
import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

const defaultCreateGroupPermissionPolicySet: PermissionPolicySet = {
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
  clientInboxId: IXmtpInboxId
  inboxIds: IXmtpInboxId[]
  permissionPolicySet?: PermissionPolicySet
  groupName?: string
  groupPhoto?: string
  groupDescription?: string
}) {
  try {
    const {
      clientInboxId,
      inboxIds,
      permissionPolicySet = defaultCreateGroupPermissionPolicySet,
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
  clientInboxId: IXmtpInboxId
  groupId: IXmtpConversationId
  inboxIds: IXmtpInboxId[]
}) {
  try {
    const { clientInboxId, groupId, inboxIds } = args

    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await addGroupMembers(client.installationId, groupId, inboxIds)
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
  clientInboxId: IXmtpInboxId
  groupId: IXmtpConversationId
  inboxIds: IXmtpInboxId[]
}) {
  try {
    const { clientInboxId, groupId, inboxIds } = args

    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await removeGroupMembers(client.installationId, groupId, inboxIds)
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
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  description: string | undefined
}) {
  const { clientInboxId, xmtpConversationId, description } = args
  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await updateGroupDescription(
      client.installationId,
      xmtpConversationId,
      // @ts-ignore because we can actually pass undefined
      description,
    )
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
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  imageUrl: string | undefined
}) {
  const { clientInboxId, xmtpConversationId, imageUrl } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await updateGroupImageUrl(
      client.installationId,
      xmtpConversationId,
      // @ts-ignore because we can actually pass undefined
      imageUrl,
    )
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

export async function updateXmtpGroupName(args: {
  clientInboxId: IXmtpInboxId
  xmtpConversationId: IXmtpConversationId
  name: string | undefined
}) {
  const { clientInboxId, xmtpConversationId, name } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await updateGroupName(
      client.installationId,
      xmtpConversationId,
      // @ts-ignore because we can actually pass undefined
      name,
    )
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

export async function removeAdminFromXmtpGroup(args: {
  clientInboxId: IXmtpInboxId
  groupId: IXmtpConversationId
  adminInboxId: IXmtpInboxId
}) {
  const { clientInboxId, groupId, adminInboxId } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await removeAdmin(client.installationId, groupId, adminInboxId)
    const endTime = Date.now()

    const duration = endTime - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Removing admin from group took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to remove admin from group",
    })
  }
}

export async function removeSuperAdminFromXmtpGroup(args: {
  clientInboxId: IXmtpInboxId
  groupId: IXmtpConversationId
  superAdminInboxId: IXmtpInboxId
}) {
  const { clientInboxId, groupId, superAdminInboxId } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await removeSuperAdmin(client.installationId, groupId, superAdminInboxId)
    const endTime = Date.now()

    const duration = endTime - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Removing super admin from group took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to remove super admin from group",
    })
  }
}

export async function addAdminToXmtpGroup(args: {
  clientInboxId: IXmtpInboxId
  groupId: IXmtpConversationId
  adminInboxId: IXmtpInboxId
}) {
  const { clientInboxId, groupId, adminInboxId } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await addAdmin(client.installationId, groupId, adminInboxId)
    const endTime = Date.now()

    const duration = endTime - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Adding admin to group took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to add admin to group",
    })
  }
}

export async function addSuperAdminToXmtpGroup(args: {
  clientInboxId: IXmtpInboxId
  groupId: IXmtpConversationId
  superAdminInboxId: IXmtpInboxId
}) {
  const { clientInboxId, groupId, superAdminInboxId } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const startTime = Date.now()
    await addSuperAdmin(client.installationId, groupId, superAdminInboxId)
    const endTime = Date.now()

    const duration = endTime - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(new Error(`Adding super admin to group took ${duration}ms`))
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to add super admin to group",
    })
  }
}
