import { useMutation } from "@tanstack/react-query";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { claimProfile } from "@/utils/api/profiles";
import { captureErrorWithToast } from "@/utils/capture-error";
import { invalidateProfileSocialsQuery } from "@/queries/useProfileSocialsQuery";
import { ProfileType } from "@/features/onboarding/types/onboarding.types";

/**
 * Hook for saving profile information using React Query mutation
 * Handles the API call, error handling, and cache invalidation
 */
export function useSaveProfileMutation() {
  const userAddress = useCurrentAccount() as string;

  return useMutation({
    mutationFn: async (args: { profile: ProfileType }) => {
      const { profile } = args;
      await claimProfile({
        account: userAddress,
        profile,
      });
      return { success: true };
    },
    onSuccess: () => {
      invalidateProfileSocialsQuery(userAddress);
    },
    onError: (error) => {
      captureErrorWithToast(error as Error);
    },
  });
}
