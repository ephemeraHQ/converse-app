import React, { memo, useLayoutEffect } from "react";
import {
  NativeSyntheticEvent,
  TextInputChangeEventData,
  View,
} from "react-native";

import { useConversationListContextMultiple } from "./ConversationList.context";
import Connecting, {
  useShouldShowConnecting,
  useShouldShowConnectingOrSyncing,
} from "../../../components/Connecting";
import NewConversationButton from "../../../components/ConversationList/NewConversationButton";
import ProfileSettingsButton from "../../../components/ConversationList/ProfileSettingsButton";
import { ErroredHeader } from "../../../components/ErroredHeader";
import { useAccountsStore } from "../../../data/store/accountsStore";
import { Button } from "../../../design-system/Button/Button";
import { HStack } from "../../../design-system/HStack";
import { Header } from "../../../design-system/Header/Header";
import { Pressable } from "../../../design-system/Pressable";
import { Text } from "../../../design-system/Text";
import { useShouldShowErrored } from "../../../hooks/useShouldShowErrored";
import { useRouter } from "../../../navigation/useNavigation";
import { useAppTheme } from "../../../theme/useAppTheme";
import { navigate } from "../../../utils/navigation";
import { getReadableProfile, shortDisplayName } from "../../../utils/str";

export function useConversationListHeader() {
  const navigation = useRouter();

  const {
    searchBarRef,
    sharingMode,
    setSearchQuery,
    setSearchBarFocused,
    showChatNullState,
  } = useConversationListContextMultiple((state) => ({
    searchBarRef: state.searchBarRef,
    sharingMode: state.sharingMode,
    setSearchQuery: state.setSearchQuery,
    setSearchBarFocused: state.setSearchBarFocused,
    showChatNullState: state.showChatNullState,
  }));

  const autoHide = !sharingMode;

  useLayoutEffect(() => {
    navigation.setOptions({
      header: (
        <Header
          titleComponent={<HeaderTitle />}
          LeftActionComponent={<HeaderLeft />}
          RightActionComponent={<HeaderRight />}
          backgroundColor="transparent"
        />
      ),
      headerSearchBarOptions: showChatNullState
        ? undefined
        : {
            ref: searchBarRef,
            hideNavigationBar: autoHide,
            hideWhenScrolling: autoHide,
            autoFocus: false,
            placeholder: "Search",
            onChangeText: (
              event: NativeSyntheticEvent<TextInputChangeEventData>
            ) => {
              setSearchQuery(event.nativeEvent.text);
            },
            onFocus: () => setSearchBarFocused(true),
            onCancelButtonPress: () => setSearchBarFocused(false),
          },
    });
  }, [
    autoHide,
    navigation,
    setSearchBarFocused,
    setSearchQuery,
    showChatNullState,
    searchBarRef,
  ]);
}

const HeaderLeft = memo(function HeaderLeft() {
  const { theme } = useAppTheme();

  const shouldShowConnecting = useShouldShowConnecting();

  const shouldShowError = useShouldShowErrored();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const name = getReadableProfile(currentAccount, currentAccount);
  const navigation = useRouter();

  return (
    <HStack style={{ alignItems: "flex-end", marginTop: -10 }}>
      <ProfileSettingsButton />
      <Pressable
        onPress={() => {
          navigation.navigate("Profile", {
            address: currentAccount,
          });
        }}
      >
        <HStack
          style={{
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <Text>
            {shouldShowConnecting.warnMessage ? shortDisplayName(name) : name}
          </Text>
          {shouldShowError && <ErroredHeader />}
        </HStack>
      </Pressable>
    </HStack>
  );
});

const HeaderRight = memo(function HeaderRight() {
  return (
    <HStack style={{ alignItems: "center", marginTop: -8 }}>
      <Button
        variant="link"
        picto="qrcode"
        onPress={() => navigate("ShareProfile")}
        hitSlop={8}
      />
      <View style={{ top: -2 }}>
        <NewConversationButton />
      </View>
    </HStack>
  );
});

const HeaderTitle = memo(function HeaderTitle() {
  const { theme } = useAppTheme();
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
  const shouldShowConnecting = useShouldShowConnecting();

  if (!shouldShowConnectingOrSyncing) {
    return null;
  }

  return (
    <HStack style={{ marginTop: -5, alignItems: "center" }}>
      {shouldShowConnectingOrSyncing && <Connecting />}
      {shouldShowConnecting.warnMessage && (
        <Text
          style={{
            color: theme.colors.text.secondary,
            marginLeft: theme.spacing.xxs,
          }}
        >
          {shouldShowConnecting.warnMessage}
        </Text>
      )}
    </HStack>
  );
});
