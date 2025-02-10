import {
  IConverseUserNameZodSchema,
  IEnsNameZodSchema,
  IFarcasterUsernameZodSchema,
  ILensHandleZodSchema,
  IProfileSocialsZodSchema,
  IUnstoppableDomainZodSchema,
} from "@/utils/api/profiles";
import { ReactNode } from "react";

export type ILensHandle = ILensHandleZodSchema;

export type IEnsName = IEnsNameZodSchema;

export type IFarcasterUsername = IFarcasterUsernameZodSchema;

export type IUnstoppableDomain = IUnstoppableDomainZodSchema;

export type IConverseUserName = IConverseUserNameZodSchema;

export type IProfileSocials = IProfileSocialsZodSchema;

export type ProfileContactCardHandle = {
  handleSave: () => Promise<{ success: boolean; error?: string }>;
  hasChanges: boolean;
  isSaving: boolean;
};

export type ICardLayoutProps = {
  avatar: ReactNode;
  content: ReactNode;
};

export type IEditableContactCardProps = {
  displayName: string;
  userName: string | undefined;
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
  userName: string | undefined;
  avatarUri: string | undefined;
};

export type IContactCardProps = {
  displayName: string;
  userName: string | undefined;
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
  displayName: string;
  userName: string | undefined;
  avatarUri: string | undefined;
  isMyProfile: boolean;
  editMode: boolean;
};
