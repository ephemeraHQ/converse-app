import logger from "@utils/logger";
import { useCallback, useState } from "react";

import { uploadFile } from "@utils/attachment/uploadFile";
import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { compressAndResizeImage } from "@utils/media";
import { invalidateProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
import {
  CreateOrUpdateProfileResponse,
  ProfileType,
} from "../types/onboarding.types";
import { checkUsernameValid, claimProfile } from "@/utils/api/profiles";

type ValidationCheck = {
  check: () => boolean;
  errorMessage: string;
};
const isProfileValid = (
  profile: ProfileType
): { success: false; errorMessage: string } | { success: true } => {
  const validationChecks: ValidationCheck[] = [
    {
      check: () => {
        if (!profile.displayName || profile.displayName.length === 0)
          return true;
        return (
          profile.displayName.length >= 3 && profile.displayName.length <= 32
        );
      },
      errorMessage:
        "Display names must be between 2 and 32 characters and can't include domain name extensions",
    },
    {
      check: () => /^[a-zA-Z0-9]*$/.test(profile.username),
      errorMessage: "Your username can only contain letters and numbers",
    },
    {
      check: () =>
        profile.username.length >= 3 && profile.username.length <= 30,
      errorMessage: "Your user name must be between 3 and 30 characters long",
    },
  ];

  for (const validation of validationChecks) {
    if (!validation.check()) {
      return {
        success: false,
        errorMessage: validation.errorMessage,
      };
    }
  }
  return { success: true };
};

export function useCreateOrUpdateProfileInfo() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const createOrUpdateProfile = useCallback(
    async (args: {
      profile: ProfileType;
    }): Promise<CreateOrUpdateProfileResponse> => {
      const { profile } = args;
      const address = getCurrentAccount()!;

      const profileValidationResult = isProfileValid(profile);
      if (!profileValidationResult.success) {
        setErrorMessage(profileValidationResult.errorMessage);
        return {
          success: false,
          errorMessage: profileValidationResult.errorMessage,
        };
      }

      setLoading(true);

      try {
        await checkUsernameValid({
          address,
          username: profile.username,
        });
      } catch (e: any) {
        logger.error(e, { context: "UserProfile: Checking username valid" });
        setLoading(false);
        const errorMessage =
          e?.response?.data?.message || "An unknown error occurred";
        setErrorMessage(errorMessage);
        return {
          success: false,
          errorMessage,
        };
      }

      let publicAvatar = "";
      if (profile.avatar) {
        if (profile.avatar.startsWith("https://")) {
          publicAvatar = profile.avatar;
        } else {
          const resizedImage = await compressAndResizeImage(
            profile.avatar,
            true
          );

          try {
            publicAvatar = await uploadFile({
              account: address,
              filePath: resizedImage.uri,
              contentType: "image/jpeg",
            });
          } catch (e: any) {
            logger.error(e, { context: "UserProfile: uploading profile pic" });
            setErrorMessage(
              e?.response?.data?.message || "An unknown error occurred"
            );
            setLoading(false);
            return {
              success: false,
              errorMessage:
                e?.response?.data?.message || "An unknown error occurred",
            };
          }
        }
      }

      try {
        await claimProfile({
          account: address,
          profile: { ...profile, avatar: publicAvatar },
        });
        await invalidateProfileSocialsQuery(address);
        return { success: true };
      } catch (e: any) {
        logger.error(e, { context: "UserProfile: claiming and refreshing" });
        setErrorMessage(
          e?.response?.data?.message || "An unknown error occurred"
        );
        setLoading(false);
        return {
          success: false,
          errorMessage:
            e?.response?.data?.message || "An unknown error occurred",
        };
      }
    },
    [setLoading, setErrorMessage]
  );

  return { createOrUpdateProfile, loading, errorMessage };
}
