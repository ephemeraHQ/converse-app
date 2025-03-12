import { InboxId } from "@xmtp/react-native-sdk"
import { memo, useCallback } from "react"
import { create } from "zustand"
import { Avatar } from "@/components/avatar"
import { createConfirmationAlert } from "@/components/promise-alert"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { createBottomSheetModalRef } from "@/design-system/BottomSheet/BottomSheet.utils"
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
import { useRemoveGroupMembersFromGroupMutation } from "@/features/groups/group-members/use-remove-group-members-from-group.mutation"
import { usePromoteToAdminMutation } from "@/features/groups/group-permissions/mutations/use-promote-group-member-to-admin.mutation"
import { usePromoteToSuperAdminMutation } from "@/features/groups/group-permissions/mutations/use-promote-group-member-to-super-admin.mutation"
import { useRevokeAdminMutation } from "@/features/groups/group-permissions/mutations/use-revoke-group-member-from-admin.mutation"
import { useRevokeSuperAdminMutation } from "@/features/groups/group-permissions/mutations/use-revoke-group-member-from-super-admin.mutation"
import { useGroupMember } from "@/features/groups/hooks/use-group-member"
import {
  getGroupMemberIsAdmin,
  getGroupMemberIsSuperAdmin,
} from "@/features/groups/utils/group-admin.utils"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useRouteParams, useRouter } from "@/navigation/use-navigation"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"

export const MemberDetailsBottomSheet = memo(function MemberDetailsBottomSheet() {
  const memberInboxId = useMemberDetailsBottomSheetStore((state) => state.memberInboxId)
  const { theme } = useAppTheme()
  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: memberInboxId,
  })
  const router = useRouter()
  const currentSender = useSafeCurrentSender()
  const { groupTopic } = useRouteParams<"GroupDetails">()

  const { groupMember: currentSenderGroupMember } = useGroupMember({
    memberInboxId: currentSender.inboxId,
    topic: groupTopic,
  })

  const { groupMember: targetGroupMember } = useGroupMember({
    memberInboxId: memberInboxId,
    topic: groupTopic,
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
    topic: groupTopic,
  })
  const { mutateAsync: promoteToSuperAdmin } = usePromoteToSuperAdminMutation({
    clientInboxId: currentSender.inboxId,
    topic: groupTopic,
  })
  const { mutateAsync: revokeSuperAdmin } = useRevokeSuperAdminMutation({
    clientInboxId: currentSender.inboxId,
    topic: groupTopic,
  })
  const { mutateAsync: revokeAdmin } = useRevokeAdminMutation({
    clientInboxId: currentSender.inboxId,
    topic: groupTopic,
  })
  const { mutateAsync: removeMember } = useRemoveGroupMembersFromGroupMutation({
    clientInboxId: currentSender.inboxId,
    topic: groupTopic,
  })

  const handleViewProfilePress = useCallback(() => {
    closeMemberDetailsBottomSheet()
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
        closeMemberDetailsBottomSheet()
        await promoteToAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Failed to promote to admin",
      })
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
        closeMemberDetailsBottomSheet()
        await revokeAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Failed to revoke admin",
      })
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
        closeMemberDetailsBottomSheet()
        await promoteToSuperAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Failed to promote to super admin",
      })
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
        closeMemberDetailsBottomSheet()
        await revokeSuperAdmin(memberInboxId!)
      }
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Failed to revoke super admin",
      })
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
      console.log("1")

      if (confirmed) {
        console.log("2")
        showSnackbar({
          message: `Removed ${targetDisplayName} from group`,
        })
        console.log("3")
        closeMemberDetailsBottomSheet()
        console.log("4")
        await removeMember([memberInboxId!])
      }
    } catch (error) {
      captureErrorWithToast(error, {
        message: "Failed to remove from group",
      })
    }
  }, [memberInboxId, removeMember, targetDisplayName])

  const handleClose = useCallback(() => {
    useMemberDetailsBottomSheetStore.getState().actions.reset()
  }, [])

  // Only show admin actions if current user is admin/super admin AND not viewing their own profile
  const showAdminActions = (isCurrentUserAdmin || isCurrentUserSuperAdmin) && !isCurrentUser

  return (
    <BottomSheetModal onClose={handleClose} enableDynamicSizing ref={memberDetailsBottomSheetRef}>
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

export function openMemberDetailsBottomSheet(memberInboxId: InboxId) {
  useMemberDetailsBottomSheetStore.getState().actions.setMemberInboxId(memberInboxId)
  memberDetailsBottomSheetRef.current?.present()
}

function closeMemberDetailsBottomSheet() {
  memberDetailsBottomSheetRef.current?.dismiss()
}

const memberDetailsBottomSheetRef = createBottomSheetModalRef()

type IMemberDetailsBottomSheetState = {
  memberInboxId: InboxId | undefined
}

type IMemberDetailsBottomSheetActions = {
  setMemberInboxId: (memberInboxId: InboxId) => void
  reset: () => void
}

type IMemberDetailsBottomSheetStore = IMemberDetailsBottomSheetState & {
  actions: IMemberDetailsBottomSheetActions
}

const initialState: IMemberDetailsBottomSheetState = {
  memberInboxId: undefined,
}

export const useMemberDetailsBottomSheetStore = create<IMemberDetailsBottomSheetStore>(
  (set, get) => ({
    ...initialState,
    actions: {
      setMemberInboxId: (memberInboxId) => set({ memberInboxId }),
      reset: () => set(initialState),
    },
  }),
)
