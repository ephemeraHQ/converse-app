import { ProfileMe } from "@/features/profiles/profile-me";
import { ProfileOther } from "@/features/profiles/profile-other";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { isCurrentSender } from "../multi-inbox/multi-inbox.store";

export function ProfileScreen(
  props: NativeStackScreenProps<NavigationParamList, "Profile">
) {
  const { inboxId } = props.route.params;

  const isMyProfile = isCurrentSender({ inboxId });

  if (isMyProfile) {
    return <ProfileMe inboxId={inboxId} />;
  }

  return <ProfileOther inboxId={inboxId} />;
}
