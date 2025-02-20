import { Button } from "@/design-system/Button/Button";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { iconRegistry } from "@/design-system/Icon/Icon";
import { Text } from "@/design-system/Text";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import {
  useProfileMeStore,
  useProfileMeStoreValue,
} from "@/features/profiles/profile-me.store";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useRouter } from "@/navigation/use-navigation";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { captureErrorWithToast } from "@/utils/capture-error";
import { Haptics } from "@/utils/haptics";
import { navigate } from "@/navigation/navigation.utils";
import { InboxId } from "@xmtp/react-native-sdk";
import { memo, useCallback } from "react";
import { ViewStyle } from "react-native";

export function useProfileMeScreenHeader(args: { inboxId: InboxId }) {
  const { inboxId } = args;

  const { theme, themed } = useAppTheme();

  const router = useRouter();

  const editMode = useProfileMeStoreValue(inboxId, (s) => s.editMode);

  const profileMeStore = useProfileMeStore(inboxId);

  const handleContextMenuAction = useCallback(
    async (actionId: string) => {
      Haptics.selectionAsync();
      switch (actionId) {
        case "edit":
          profileMeStore.getState().actions.setEditMode(true);
          break;
        case "share":
          router.navigate("ShareProfile");
          break;
      }
    },
    [profileMeStore, router]
  );

  useHeader(
    {
      backgroundColor: theme.colors.background.surface,
      safeAreaEdges: ["top"],
      titleComponent: (
        <Text preset="body">
          {router.canGoBack()
            ? router.getState().routes[router.getState().routes.length - 2].name
            : ""}
        </Text>
      ),
      LeftActionComponent: (
        <HeaderAction
          icon="chevron.left"
          onPress={() => {
            router.goBack();
          }}
        />
      ),
      RightActionComponent: (
        <HStack style={themed($headerRightContainer)}>
          {editMode ? (
            <DoneAction inboxId={inboxId} />
          ) : (
            <>
              <HeaderAction
                icon="qrcode"
                onPress={() => {
                  navigate("ShareProfile");
                }}
              />
              <DropdownMenu
                style={themed($dropdownMenu)}
                onPress={handleContextMenuAction}
                actions={[
                  {
                    id: "edit",
                    title: translate("userProfile.edit"),
                    image: iconRegistry["pencil"],
                  },
                  {
                    id: "share",
                    title: translate("share"),
                    image: iconRegistry["square.and.arrow.up"],
                  },
                ]}
              >
                <HeaderAction icon="more_vert" />
              </DropdownMenu>
            </>
          )}
        </HStack>
      ),
    },
    [router, theme, editMode, handleContextMenuAction, inboxId]
  );
}

const DoneAction = memo(function DoneAction({ inboxId }: { inboxId: InboxId }) {
  const profileMeStore = useProfileMeStore(inboxId);

  const handleDoneEditProfile = useCallback(async () => {
    try {
      const newNameTextValue = profileMeStore.getState().nameTextValue;
      const newAvatarUri = profileMeStore.getState().avatarUri;

      console.log("newNameTextValue", newNameTextValue);
      console.log("newAvatarUri", newAvatarUri);

      // TODO: Need to check to make sure we're aligned with what the new backend and the onboarding is doing
      // await saveProfileAsync();

      profileMeStore.getState().actions.reset();
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [profileMeStore]);

  return (
    <Button
      text={translate("userProfile.done")}
      variant="text"
      onPress={handleDoneEditProfile}
    />
  );
});

const $headerRightContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  columnGap: spacing.xxs,
});

const $dropdownMenu: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
  paddingRight: spacing.xxxs,
});
