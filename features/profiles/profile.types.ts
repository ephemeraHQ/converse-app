import { InboxId } from "@xmtp/react-native-sdk";
import { ReactNode } from "react";

export type ProfileContactCardHandle = {
  handleSave: () => Promise<{ success: boolean; error?: string }>;
  hasChanges: boolean;
  isSaving: boolean;
};

export type ICardLayoutProps = {
  avatar: ReactNode;
  name: ReactNode;
  additionalOptions?: ReactNode;
};

export type IEditableContactCardProps = {
  displayName: string;
  username: string;
  avatarUri: string | undefined;
  onAvatarPress: () => void;
  onDisplayNameChange: (text: string) => void;
  editableDisplayName: string;
  isLoading: boolean;
  error: string | undefined;
  status: "error" | "disabled" | undefined;
};

export type IReadOnlyContactCardProps = {
  displayName: string;
  username: string;
  avatarUri: string | undefined;
};

export type IContactCardProps = {
  displayName: string;
  username: string;
  avatarUri: string | undefined;
  isMyProfile: boolean;
  editMode: boolean;
  onAvatarPress: () => void;
  onDisplayNameChange: (text: string) => void;
  editableDisplayName: string;
  isLoading: boolean;
  error: string | undefined;
  status: "error" | "disabled" | undefined;
};

export type IProfileContactCardProps = {
  inboxId: InboxId;
};
