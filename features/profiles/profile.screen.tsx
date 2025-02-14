import { ProfileMe } from "@/features/profiles/profile-me";
import { ProfileOther } from "@/features/profiles/profile-other";
import { isCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";

export function ProfileScreen(
  props: NativeStackScreenProps<NavigationParamList, "Profile">
) {
  const { inboxId } = props.route.params;

  const isMyProfile = isCurrentAccountInboxId(inboxId);

  if (isMyProfile) {
    return <ProfileMe inboxId={inboxId} />;
  }

  return <ProfileOther inboxId={inboxId} />;
}
