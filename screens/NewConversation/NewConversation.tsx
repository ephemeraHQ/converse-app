import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  itemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

import { NewConversationModalParams } from "./NewConversationModal";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import AndroidBackAction from "../../components/AndroidBackAction";
import ConverseButton from "../../components/Button/Button";
import SearchBar from "../../components/NewConversation/SearchBar";
import Recommendations from "../../components/Recommendations/Recommendations";
import ProfileSearch from "../../components/Search/ProfileSearch";
import TableView from "../../components/TableView/TableView";
import { TableViewPicto } from "../../components/TableView/TableViewImage";
import config from "../../config";
import {
  currentAccount,
  getProfilesStore,
  useChatStore,
  useRecommendationsStore,
} from "../../data/store/accountsStore";
import { ProfileSocials } from "../../data/store/profilesStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { searchProfiles } from "../../utils/api";
import {
  getAddressForPeer,
  getCleanAddress,
  isSupportedPeer,
} from "../../utils/evm/address";
import { navigate } from "../../utils/navigation";
import { isEmptyObject } from "../../utils/objects";
import { getPreferredName } from "../../utils/profile";
import { isOnXmtp } from "../../utils/xmtpRN/client";

export default function NewConversation({
  route,
  navigation,
}: NativeStackScreenProps<
  NewConversationModalParams,
  "NewConversationScreen"
>) {
  const colorScheme = useColorScheme();
  const [group, setGroup] = useState({
    enabled: !!route.params?.addingToGroupTopic,
    members: [] as (ProfileSocials & { address: string })[],
  });
  const { addMembers } = useGroupMembers(
    route.params?.addingToGroupTopic ?? ""
  );
  const existingGroup = useChatStore((s) =>
    route.params?.addingToGroupTopic
      ? s.conversations[route.params.addingToGroupTopic]
      : undefined
  );
  const [loading, setLoading] = useState(false);
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const styles = useStyles();

  const handleRightAction = useCallback(async () => {
    if (route.params?.addingToGroupTopic) {
      setLoading(true);
      try {
        await addMembers(group.members.map((m) => m.address));
        navigation.goBack();
      } catch (e) {
        setLoading(false);
        console.error(e);
        Alert.alert("An error occured");
      }
    } else {
      navigation.push("NewGroupSummary", {
        members: group.members,
      });
    }
  }, [addMembers, group.members, navigation, route.params?.addingToGroupTopic]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <Button
            title="Cancel"
            color={textPrimaryColor(colorScheme)}
            onPress={handleBack}
          />
        ) : (
          <AndroidBackAction navigation={navigation} />
        ),
      headerTitle: group.enabled
        ? route.params?.addingToGroupTopic
          ? "Add members"
          : "New group"
        : "New conversation",
      headerRight: () => {
        if (group.enabled && group.members.length > 0) {
          if (loading) {
            return <ActivityIndicator style={styles.activityIndicator} />;
          } else {
            return (
              <ConverseButton
                variant="text"
                title={route.params?.addingToGroupTopic ? "Add" : "Next"}
                onPress={handleRightAction}
                style={{ marginRight: -10, padding: 10 }}
              />
            );
          }
        }
        return undefined;
      },
    });
  }, [
    group,
    loading,
    navigation,
    route.params?.addingToGroupTopic,
    addMembers,
    handleBack,
    handleRightAction,
    styles.activityIndicator,
    colorScheme,
  ]);

  const [value, setValue] = useState(route.params?.peer || "");
  const searchingForValue = useRef("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    inviteToConverse: "",
    profileSearchResults: {} as { [address: string]: ProfileSocials },
  });

  const {
    updatedAt: recommendationsUpdatedAt,
    loading: recommendationsLoading,
    frens,
  } = useRecommendationsStore(useSelect(["updatedAt", "loading", "frens"]));
  const recommendationsLoadedOnce = recommendationsUpdatedAt > 0;
  const recommendationsFrensCount = Object.keys(frens).length;

  const debounceDelay = 500;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value.length < 3) {
      // If the input is less than 3 characters, do nothing
      setStatus({
        loading: false,
        error: "",
        inviteToConverse: "",
        profileSearchResults: {},
      });
      return;
    }

    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const searchForValue = async () => {
        setStatus(({ loading }) => ({
          loading,
          error: "",
          inviteToConverse: "",
          profileSearchResults: {},
        }));

        if (isSupportedPeer(value)) {
          setStatus(({ error }) => ({
            loading: true,
            error,
            inviteToConverse: "",
            profileSearchResults: {},
          }));
          searchingForValue.current = value;
          const resolvedAddress = await getAddressForPeer(value);
          if (searchingForValue.current === value) {
            // If we're still searching for this one
            if (!resolvedAddress) {
              const isLens = value.endsWith(config.lensSuffix);
              const isFarcaster = value.endsWith(".fc");
              setStatus({
                loading: false,
                profileSearchResults: {},
                inviteToConverse: "",
                error:
                  isLens || isFarcaster
                    ? "This handle does not exist. Please try again."
                    : "No address has been set for this domain.",
              });

              return;
            }
            const address = getCleanAddress(resolvedAddress);
            const addressIsOnXmtp = await isOnXmtp(address);
            if (searchingForValue.current === value) {
              if (addressIsOnXmtp) {
                // Let's search with the exact address!
                const profiles = await searchProfiles(
                  address,
                  currentAccount()
                );

                if (!isEmptyObject(profiles)) {
                  // Let's save the profiles for future use
                  getProfilesStore(currentAccount())
                    .getState()
                    .saveSocials(profiles);
                  setStatus({
                    loading: false,
                    error: "",
                    inviteToConverse: "",
                    profileSearchResults: profiles,
                  });
                } else {
                  setStatus({
                    loading: false,
                    error: "",
                    inviteToConverse: "",
                    profileSearchResults: {},
                  });
                }
              } else {
                setStatus({
                  loading: false,
                  error: `${value} does not use Converse or XMTP yet`,
                  inviteToConverse: value,
                  profileSearchResults: {},
                });
              }
            }
          }
        } else {
          setStatus({
            loading: true,
            error: "",
            inviteToConverse: "",
            profileSearchResults: {},
          });

          const profiles = await searchProfiles(value, currentAccount());

          if (!isEmptyObject(profiles)) {
            // Let's save the profiles for future use
            getProfilesStore(currentAccount()).getState().saveSocials(profiles);
            setStatus({
              loading: false,
              error: "",
              inviteToConverse: "",
              profileSearchResults: profiles,
            });
          } else {
            setStatus({
              loading: false,
              error: "",
              inviteToConverse: "",
              profileSearchResults: {},
            });
          }
        }
      };
      searchForValue();
    }, debounceDelay);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  const showRecommendations =
    !status.loading && value.length === 0 && recommendationsFrensCount > 0;

  const profiles = getProfilesStore(currentAccount()).getState().profiles;

  const inputPlaceholder = ".converse.xyz, 0x, .eth, .lens, .fc, .cb.id, UD…";
  const onRef = useCallback(
    (r: TextInput | null) => {
      if (!initialFocus.current) {
        initialFocus.current = true;
        if (
          (!value &&
            !recommendationsLoading &&
            recommendationsLoadedOnce &&
            recommendationsFrensCount === 0) ||
          Platform.OS === "web" // On web, always focus
        ) {
          setTimeout(() => {
            r?.focus();
          }, 100);
        }
      }
      inputRef.current = r;
    },
    [
      recommendationsFrensCount,
      recommendationsLoadedOnce,
      recommendationsLoading,
      value,
    ]
  );

  return (
    <View style={styles.searchContainer}>
      <SearchBar
        value={value}
        setValue={setValue}
        onRef={onRef}
        inputPlaceholder={inputPlaceholder}
      />
      <View
        style={[
          styles.group,
          {
            display:
              group.enabled && group.members.length === 0 ? "none" : "flex",
          },
        ]}
      >
        {!group.enabled && (
          <ConverseButton
            variant="text"
            picto="person.2"
            title="New group"
            style={styles.newGroupButton}
            textStyle={{ fontWeight: "500" }}
            onPress={() => {
              setGroup({ enabled: true, members: [] });
            }}
          />
        )}

        {group.enabled &&
          group.members.length > 0 &&
          group.members.map((m, index) => {
            const preferredName = getPreferredName(m, m.address);

            return (
              <ConverseButton
                key={m.address}
                title={preferredName}
                variant="secondary"
                picto="xmark"
                style={styles.groupMemberButton}
                textStyle={{
                  lineHeight: 17,
                  top: Platform.OS === "ios" ? undefined : 1,
                }}
                onPress={() =>
                  setGroup((g) => {
                    const members = [...g.members];
                    members.splice(index, 1);
                    return {
                      ...g,
                      members,
                    };
                  })
                }
              />
            );
          })}
      </View>

      {!status.loading && !isEmptyObject(status.profileSearchResults) && (
        <View>
          <ProfileSearch
            navigation={navigation}
            profiles={(() => {
              const searchResultsToShow = { ...status.profileSearchResults };
              if (group.enabled && group.members) {
                group.members.forEach((member) => {
                  delete searchResultsToShow[member.address];
                });
              }
              if (existingGroup) {
                existingGroup.groupMembers?.forEach((a) => {
                  delete searchResultsToShow[a];
                });
              }
              return searchResultsToShow;
            })()}
            groupMode={group.enabled}
            addToGroup={async (member) => {
              setGroup((g) => ({ ...g, members: [...g.members, member] }));
              setValue("");
            }}
          />
        </View>
      )}

      {isEmptyObject(status.profileSearchResults) && (
        <View
          style={{
            backgroundColor: backgroundColor(colorScheme),
            height: showRecommendations ? undefined : 0,
          }}
        >
          <Recommendations
            visibility="EMBEDDED"
            navigation={navigation}
            profiles={profiles}
            groupMode={group.enabled}
            groupMembers={group.members}
            addToGroup={async (member) => {
              setGroup((g) => ({ ...g, members: [...g.members, member] }));
              setValue("");
            }}
          />
        </View>
      )}

      <ScrollView
        style={[styles.modal, { height: showRecommendations ? 0 : undefined }]}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => {
          inputRef.current?.blur();
        }}
      >
        {!status.loading && isEmptyObject(status.profileSearchResults) && (
          <View style={styles.messageContainer}>
            {status.error ? (
              <Text style={[styles.message, styles.error]}>{status.error}</Text>
            ) : (
              <Text style={styles.message}>
                <Text>
                  Type the full address/domain of your contact (with
                  .converse.xyz, .eth, .lens, .fc, .cb.id…)
                </Text>
              </Text>
            )}
          </View>
        )}

        {status.loading && (
          <ActivityIndicator style={styles.mainActivityIndicator} />
        )}

        {!status.loading && !!status.inviteToConverse && (
          <TableView
            items={[
              {
                id: "inviteToConverse",
                leftView: <TableViewPicto symbol="link" />,
                title: "Invite them to Converse",
                subtitle: "",
                action: () => {
                  navigation.goBack();
                  navigate("ShareProfile");
                },
              },
            ]}
            style={styles.tableView}
          />
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    messageContainer: {
      ...Platform.select({
        default: {
          marginTop: 23,
          paddingHorizontal: 16,
        },
        android: {
          marginRight: 16,
          marginLeft: 16,
          marginTop: 16,
        },
      }),
    },
    message: {
      ...Platform.select({
        default: {
          fontSize: 17,
          textAlign: "center",
        },
        android: {
          fontSize: 14,
        },
      }),

      color: textSecondaryColor(colorScheme),
    },
    clickableText: {
      color: primaryColor(colorScheme),
      fontWeight: "500",
    },
    error: {
      color:
        Platform.OS === "android"
          ? textSecondaryColor(colorScheme)
          : textPrimaryColor(colorScheme),
    },
    mainActivityIndicator: {
      marginTop: 23,
    },
    tableView: {
      marginHorizontal: Platform.OS === "android" ? 0 : 18,
    },
    tableViewActivityIndicator: {
      width: 32,
      height: 32,
      ...Platform.select({
        default: { marginRight: 8 },
        android: { marginLeft: 12, marginRight: -4 },
      }),
    },
    group: {
      minHeight: 50,
      paddingBottom: Platform.OS === "ios" ? 10 : 0,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: Platform.OS === "ios" ? 16 : 0,
      justifyContent: "flex-start",
      borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      flexWrap: "wrap",
    },
    groupMemberButton: {
      padding: 0,
      marginHorizontal: 0,
      marginRight: 10,
      height: Platform.OS === "ios" ? 30 : undefined,
      marginTop: 10,
    },
    activityIndicator: {
      marginRight: 5,
    },
    searchContainer: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: Platform.OS === "web" ? 20 : undefined,
    },
    newGroupButton: {
      marginLeft: 7,
      paddingTop: Platform.OS === "ios" ? 13 : 10,
      paddingBottom: Platform.OS === "ios" ? 0 : 10,
    },
  });
};
