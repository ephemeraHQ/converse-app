import { memo, useCallback } from "react"
import { Avatar } from "@/components/avatar"
import { createConfirmationAlert } from "@/components/promise-alert"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { BottomSheetContentContainer } from "@/design-system/BottomSheet/BottomSheetContentContainer"
import {
  BottomSheetHeader,
  BottomSheetHeaderTitle,
} from "@/design-system/BottomSheet/BottomSheetHeader"
import { BottomSheetModal } from "@/design-system/BottomSheet/BottomSheetModal"
import { HStack } from "@/design-system/HStack"
import { ListItem, ListItemEndRightChevron, ListItemTitle } from "@/design-system/list-item"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  closeGroupMemberDetailsBottomSheet,
  groupMemberDetailsBottomSheetRef,
} from "@/features/groups/components/group-member-details/group-member-details.service"
import { useGroupMemberDetailsBottomSheetStore } from "@/features/groups/components/group-member-details/group-member-details.store"
import { useGroupMember } from "@/features/groups/hooks/use-group-member"
import { usePromoteToAdminMutation } from "@/features/groups/mutations/promote-group-member-to-admin.mutation"
import { usePromoteToSuperAdminMutation } from "@/features/groups/mutations/promote-group-member-to-super-admin.mutation"
import { useRemoveGroupMembersFromGroupMutation } from "@/features/groups/mutations/remove-group-members-from-group.mutation"
import { useRevokeAdminMutation } from "@/features/groups/mutations/revoke-group-member-from-admin.mutation"
import { useRevokeSuperAdminMutation } from "@/features/groups/mutations/revoke-group-member-from-super-admin.mutation"
import {
  getGroupMemberIsAdmin,
  getGroupMemberIsSuperAdmin,
} from "@/features/groups/utils/group-admin.utils"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useRouteParams, useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"

export const GroupMemberDetailsBottomSheet = memo(function GroupMemberDetailsBottomSheet() {
  const memberInboxId = useGroupMemberDetailsBottomSheetStore((state) => state.memberInboxId)
  const { theme } = useAppTheme()
  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: memberInboxId,
  })
  const router = useRouter()
  const currentSender = useSafeCurrentSender()
  const { xmtpConversationId } = useRouteParams<"GroupDetails">()

  const { groupMember: currentSenderGroupMember } = useGroupMember({
    memberInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { groupMember: targetGroupMember } = useGroupMember({
    memberInboxId: memberInboxId,
    xmtpConversationId,
  })

  const { displayName: targetDisplayName } = usePreferredDisplayInfo({
    inboxId: memberInboxId,
  })

  const isCurrentUser = currentSender.inboxId === memberInboxId

  const isCurrentUserAdmin =
    currentSenderGroupMember &&
    getGroupMemberIsAdmin({
      member: currentSenderGroupMember,
    })
  const isCurrentUserSuperAdmin =
    currentSenderGroupMember &&
    getGroupMemberIsSuperAdmin({
      member: currentSenderGroupMember,
    })

  const isTargetGroupMemberAdmin =
    targetGroupMember &&
    getGroupMemberIsAdmin({
      member: targetGroupMember,
    })
  const isTargetGroupMemberSuperAdmin =
    targetGroupMember &&
    getGroupMemberIsSuperAdmin({
      member: targetGroupMember,
    })

  const { mutateAsync: promoteToAdmin } = usePromoteToAdminMutation({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })
  const { mutateAsync: promoteToSuperAdmin } = usePromoteToSuperAdminMutation({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })
  const { mutateAsync: revokeSuperAdmin } = useRevokeSuperAdminMutation({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })
  const { mutateAsync: revokeAdmin } = useRevokeAdminMutation({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })
  const { mutateAsync: removeMember } = useRemoveGroupMembersFromGroupMutation({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const handleViewProfilePress = useCallback(() => {
    closeGroupMemberDetailsBottomSheet()
    router.push("Profile", { inboxId: memberInboxId! })
  }, [memberInboxId, router])

  const handleMakeAdminPress = useCallback(async () => {
    try {
      const confirmed = await createConfirmationAlert({
        title: "Make Admin",
        message: `Are you sure you want to make ${targetDisplayName} an admin?`,
        confirmText: "Make Admin",
        cancelText: "Cancel",
      })

      if (confirmed) {
        showSnackbar({
          message: `Made ${targetDisplayName} an admin`,
        })
        closeGroupMemberDetailsBottomSheet()
        await promoteToAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Failed to promote to admin" }),
      )
    }
  }, [memberInboxId, promoteToAdmin, targetDisplayName])

  const handleRevokeAdminPress = useCallback(async () => {
    try {
      const confirmed = await createConfirmationAlert({
        title: "Revoke Admin",
        message: `Are you sure you want to revoke ${targetDisplayName}'s admin privileges?`,
        confirmText: "Revoke",
        cancelText: "Cancel",
      })

      if (confirmed) {
        showSnackbar({
          message: `Revoked ${targetDisplayName} as admin`,
        })
        closeGroupMemberDetailsBottomSheet()
        await revokeAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Failed to revoke admin" }),
      )
    }
  }, [memberInboxId, revokeAdmin, targetDisplayName])

  const handleMakeSuperAdminPress = useCallback(async () => {
    try {
      const confirmed = await createConfirmationAlert({
        title: "Make Super Admin",
        message: `Are you sure you want to make ${targetDisplayName} a super admin?`,
        confirmText: "Make Super Admin",
        cancelText: "Cancel",
      })

      if (confirmed) {
        showSnackbar({
          message: `Made ${targetDisplayName} a super admin`,
        })
        closeGroupMemberDetailsBottomSheet()
        await promoteToSuperAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Failed to promote to super admin" }),
      )
    }
  }, [memberInboxId, promoteToSuperAdmin, targetDisplayName])

  const handleRevokeSuperAdminPress = useCallback(async () => {
    try {
      const confirmed = await createConfirmationAlert({
        title: "Revoke Super Admin",
        message: `Are you sure you want to revoke ${targetDisplayName}'s super admin privileges?`,
        confirmText: "Revoke",
        cancelText: "Cancel",
      })

      if (confirmed) {
        showSnackbar({
          message: `Revoked ${targetDisplayName} as super admin`,
        })
        closeGroupMemberDetailsBottomSheet()
        await revokeSuperAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Failed to revoke super admin" }),
      )
    }
  }, [memberInboxId, revokeSuperAdmin, targetDisplayName])

  const handleRemoveFromGroupPress = useCallback(async () => {
    try {
      const confirmed = await createConfirmationAlert({
        title: "Remove Member",
        message: `Are you sure you want to remove ${targetDisplayName} from the group?`,
        confirmText: "Remove",
        cancelText: "Cancel",
      })

      if (confirmed) {
        showSnackbar({
          message: `Removed ${targetDisplayName} from group`,
        })

        closeGroupMemberDetailsBottomSheet()

        await removeMember([memberInboxId!])
      }
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Failed to remove from group" }),
      )
    }
  }, [memberInboxId, removeMember, targetDisplayName])

  const handleClose = useCallback(() => {
    useGroupMemberDetailsBottomSheetStore.getState().actions.reset()
  }, [])

  // Only show admin actions if current user is admin/super admin AND not viewing their own profile
  const showAdminActions = (isCurrentUserAdmin || isCurrentUserSuperAdmin) && !isCurrentUser

  return (
    <BottomSheetModal
      onClose={handleClose}
      enableDynamicSizing
      ref={groupMemberDetailsBottomSheetRef}
    >
      <BottomSheetContentContainer withBottomInsets>
        <BottomSheetHeader
          title={
            <HStack
              style={{
                alignItems: "center",
                columnGap: theme.spacing.xxs,
              }}
            >
              <Avatar uri={avatarUrl} name={displayName} size="sm" />
              <BottomSheetHeaderTitle>{displayName}</BottomSheetHeaderTitle>
            </HStack>
          }
        />
        <VStack>
          <ListItem
            onPress={handleViewProfilePress}
            title="View profile"
            end={<ListItemEndRightChevron />}
          />

          {showAdminActions && (
            <>
              {/* Show make/revoke admin based on current status */}
              {isTargetGroupMemberAdmin ? (
                <ListItem
                  onPress={handleRevokeAdminPress}
                  title="Revoke admin"
                  subtitle="Remove admin privileges from this member"
                />
              ) : (
                <ListItem
                  onPress={handleMakeAdminPress}
                  title="Make admin"
                  subtitle="Can moderate members and access admin features"
                />
              )}

              {/* Only super admins can manage super admin status */}
              {isCurrentUserSuperAdmin && (
                <>
                  {isTargetGroupMemberSuperAdmin ? (
                    <ListItem
                      onPress={handleRevokeSuperAdminPress}
                      title="Revoke super admin"
                      subtitle="Remove super admin privileges from this member"
                    />
                  ) : (
                    <ListItem
                      onPress={handleMakeSuperAdminPress}
                      title="Make super admin"
                      subtitle="Full control over group settings and permissions"
                    />
                  )}
                </>
              )}

              <ListItem
                onPress={handleRemoveFromGroupPress}
                title={<ListItemTitle color="caution">Remove from group</ListItemTitle>}
              />
            </>
          )}
        </VStack>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  )
})
