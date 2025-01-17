import logger from "@utils/logger";
import { useCallback, useState } from "react";

import { uploadFile } from "@utils/attachment/uploadFile";
import { getCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { compressAndResizeImage } from "@utils/media";
import { invalidateProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
import {
  CreateOrUpdateProfileResponse,
  ProfileType,
} from "../types/onboarding.types";
import { checkUsernameValid, claimProfile } from "@/utils/api/profiles";

export function useCreateOrUpdateProfileInfo() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const createOrUpdateProfile = useCallback(
    async (args: {
      profile: ProfileType;
    }): Promise<CreateOrUpdateProfileResponse> => {
      const { profile } = args;

      const address = getCurrentAccount()!;

      if (
        profile.displayName &&
        profile.displayName.length > 0 &&
        (profile.displayName.length < 3 || profile.displayName.length > 32)
      ) {
        setErrorMessage(translate("userProfile.errors.displayNameLength"));
        return {
          success: false,
          errorMessage: translate("userProfile.errors.displayNameLength"),
        };
      }

      if (!/^[a-zA-Z0-9]*$/.test(profile.username)) {
        setErrorMessage(translate("userProfile.errors.usernameAlphanumeric"));
        return {
          success: false,
          errorMessage: translate("userProfile.errors.usernameAlphanumeric"),
        };
      }

      if (profile.username.length < 3 || profile.username.length > 30) {
        setErrorMessage(translate("userProfile.errors.usernameLength"));
        logger.debug(
          `[OnboardingContactCardScreen]5 ${profile.username.length} + ${profile.username}`
        );

        return {
          success: false,
          errorMessage: translate("userProfile.errors.usernameLength"),
        };
      }

      setLoading(true);

      try {
        await checkUsernameValid(address, profile.username);
      } catch (e: any) {
        logger.error(e, { context: "UserProfile: Checking username valid" });
        setLoading(false);
        setErrorMessage(
          e?.response?.data?.message || "An unknown error occurred"
        );
        return {
          success: false,
          errorMessage:
            e?.response?.data?.message || "An unknown error occurred",
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
