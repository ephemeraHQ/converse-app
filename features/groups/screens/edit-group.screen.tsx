import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { memo, useCallback, useEffect } from "react"
import { create } from "zustand"
import { Avatar } from "@/components/avatar"
import { GroupAvatar } from "@/components/group-avatar"
import { Screen } from "@/components/screen/screen"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { Center } from "@/design-system/Center"
import { EmptyState } from "@/design-system/empty-state"
import { Icon } from "@/design-system/Icon/Icon"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { TextField } from "@/design-system/TextField/TextField"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useUpdateGroup } from "@/features/groups/mutations/update-group.mutation"
import { useGroupQuery } from "@/features/groups/queries/group.query"
import { useAddPfp } from "@/hooks/use-add-pfp"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useHeader } from "@/navigation/use-header"
import { useRouteParams, useRouter } from "@/navigation/use-navigation"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"

export const EditGroupScreen = memo(function EditGroupScreen(
  props: NativeStackScreenProps<NavigationParamList, "EditGroup">,
) {
  const { xmtpConversationId } = props.route.params

  const router = useRouter()
  const currentSender = useSafeCurrentSender()
  const { theme } = useAppTheme()

  const { data: group, isLoading: isGroupLoading } = useGroupQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { mutateAsync: updateGroupAsync } = useUpdateGroup({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const handleCancelPress = useCallback(() => {
    router.goBack()
  }, [router])

  useEffect(() => {
    return () => {
      useEditGroupStore.getState().actions.reset()
    }
  }, [])

  const handleDonePress = useCallback(async () => {
    try {
      const storeState = useEditGroupStore.getState()
      const updatedFields: Partial<IEditGroupState> = {}

      if (storeState.name !== undefined && storeState.name !== group?.name) {
        updatedFields.name = storeState.name
      }
      if (storeState.description !== undefined && storeState.description !== group?.description) {
        updatedFields.description = storeState.description
      }
      if (storeState.imageUrl !== undefined && storeState.imageUrl !== group?.imageUrl) {
        updatedFields.imageUrl = storeState.imageUrl
      }

      if (Object.keys(updatedFields).length > 0) {
        await updateGroupAsync(updatedFields)
        showSnackbar({
          message: "Group updated",
        })
      }

      router.goBack()
    } catch (error) {
      captureErrorWithToast(new GenericError({ error, additionalMessage: "Error updating group" }))
    }
  }, [router, updateGroupAsync, group])

  useHeader({
    safeAreaEdges: ["top"],
    leftText: "Cancel",
    rightText: "Done",
    onLeftPress: handleCancelPress,
    onRightPress: handleDonePress,
  })

  if (isGroupLoading) {
    return null
  }

  if (!group) {
    return (
      <Screen preset="fixed" contentContainerStyle={$globalStyles.flex1}>
        <EmptyState
          title="Group not found"
          description="This might be an issue. Please report it to support."
        />
      </Screen>
    )
  }

  console.log("group:", group)

  return (
    <Screen preset="fixed">
      <VStack
        style={{
          rowGap: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
        }}
      >
        <Center>
          <GroupAvatarEditor />
        </Center>

        <TextField
          helper={<GroupNameCharacterCounter />}
          label="Name"
          onChangeText={useEditGroupStore.getState().actions.setName}
          defaultValue={group.name}
        />
        <TextField
          label="Description"
          onChangeText={useEditGroupStore.getState().actions.setDescription}
          defaultValue={group.description}
          multiline
          helper={<GroupDescriptionCharacterCounter />}
        />
      </VStack>
    </Screen>
  )
})

const GroupAvatarEditor = memo(function GroupAvatarEditor() {
  const { theme } = useAppTheme()
  const { xmtpConversationId } = useRouteParams<"EditGroup">()

  const { addPFP, asset } = useAddPfp()

  const handleAvatarPress = useCallback(async () => {
    try {
      const url = await addPFP()
      useEditGroupStore.getState().actions.imageUrl(url)
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Error adding group avatar" }),
      )
    }
  }, [addPFP])

  return (
    <Pressable
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={handleAvatarPress}
    >
      {asset ? (
        <Avatar name="" source={{ uri: asset.uri }} size="xxl" />
      ) : (
        <GroupAvatar xmtpConversationId={xmtpConversationId} size="xxl" />
      )}
      <Center
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: theme.avatarSize.md,
          height: theme.avatarSize.md,
          borderRadius: theme.borderRadius.md,
          borderWidth: theme.borderWidth.sm,
          borderColor: theme.colors.border.inverted.subtle,
          backgroundColor: theme.colors.fill.primary,
        }}
      >
        <Icon icon="camera" size={theme.iconSize.md} color={theme.colors.fill.inverted.primary} />
      </Center>
    </Pressable>
  )
})

const GroupNameCharacterCounter = memo(function GroupNameCharacterCounter() {
  const { xmtpConversationId } = useRouteParams<"EditGroup">()
  const currentSender = useSafeCurrentSender()
  const { data: group } = useGroupQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })
  const name = useEditGroupStore((state) => state.name)
  return (
    <Text preset="formHelper">
      {name !== undefined ? name.length : group?.name?.length || 0} / 100
    </Text>
  )
})

const GroupDescriptionCharacterCounter = memo(function GroupDescriptionCharacterCounter() {
  const { xmtpConversationId } = useRouteParams<"EditGroup">()
  const currentSender = useSafeCurrentSender()
  const { data: group } = useGroupQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })
  const description = useEditGroupStore((state) => state.description)
  return (
    <Text preset="formHelper">
      {description !== undefined ? description.length : group?.description?.length || 0} / 300
    </Text>
  )
})

type IEditGroupState = {
  name?: string
  description?: string
  imageUrl?: string
}

type IEditGroupActions = {
  setName: (name: string) => void
  setDescription: (description: string) => void
  imageUrl: (imageUrl: string) => void
  reset: () => void
}

type IEditGroupStore = IEditGroupState & {
  actions: IEditGroupActions
}

const initialState: IEditGroupState = {
  name: undefined,
  description: undefined,
  imageUrl: undefined,
}

export const useEditGroupStore = create<IEditGroupStore>((set) => ({
  ...initialState,
  actions: {
    setName: (name) => set({ name }),
    setDescription: (description) => set({ description }),
    imageUrl: (imageUrl) => set({ imageUrl }),
    reset: () => set(initialState),
  },
}))
