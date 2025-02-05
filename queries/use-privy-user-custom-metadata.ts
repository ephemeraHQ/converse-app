// todo this needs to be on the backend due to requiring privy secret
// import { useCallback, useMemo } from "react";
// import {
//   useQuery,
//   useMutation,
//   useQueryClient,
//   queryOptions,
//   skipToken,
// } from "@tanstack/react-query";
// import { usePrivy } from "@privy-io/expo";
// import { z } from "zod";
// import logger from "@/utils/logger";
// import { btoa } from "react-native-quick-base64";
// import { config } from "@/config";
// import { privyCustomMetadataQueryKey } from "@/queries/QueryKeys";

// /**
//  * Schema for mapping device model IDs to inbox preferences
//  * @example
//  * inboxActiveByInstallation: {
//  *   "iPhone14,3": {  // Device model ID
//  *     "mike.eth": true,
//  *     "mikeHatesBikes.": false,
//  *   },
//  *   "iPhone13,4": {  // Different device model ID
//  *     "mike.eth": true,
//  *     "mikeHatesBikes.": true,
//  *   }
//  * }
//  */
// const privyLinkedAccountSchema = z.object({
//   type: z.string(),
//   address: z.string().optional(),
// });

// const privyUserResponseSchema = z.object({
//   id: z.string(),
//   custom_metadata: z
//     .object({
//       inboxActiveByInstallation: z.string().default("{}"),
//     })
//     .optional()
//     .default({}),
//   linked_accounts: z.array(privyLinkedAccountSchema),
// });

// export const privyCustomMetadataSchema = z.object({
//   inboxActiveByInstallation: z
//     .string()
//     .transform((str) => {
//       try {
//         return JSON.parse(str);
//       } catch {
//         return {};
//       }
//     })
//     .default("{}"),
// });

// export type IPrivyCustomMetadata = z.infer<typeof privyCustomMetadataSchema>;

// function getPrivyCustomMetadataQueryOptions({
//   privyUserId,
//   getPrivyCustomMetadata,
// }: {
//   privyUserId: string | undefined;
//   getPrivyCustomMetadata: (userId: string) => Promise<IPrivyCustomMetadata>;
// }) {
//   const enabled = !!privyUserId;
//   return queryOptions({
//     queryKey: privyCustomMetadataQueryKey(privyUserId),
//     queryFn: enabled
//       ? () => {
//           return getPrivyCustomMetadata(privyUserId);
//         }
//       : skipToken,
//     enabled,
//   });
// }

// export function usePrivyUserCustomMetadataForCurrentAccount() {
//   const { user } = usePrivy();
//   const linkedSmartWalletAddresses = user?.linked_accounts
//     .filter((linkedAccount) => linkedAccount.type === "smart_wallet")
//     .map((linkedAccount) => linkedAccount.address);

//   const defaultMetadata = useMemo(() => {
//     return {
//       inboxActiveByInstallation: linkedSmartWalletAddresses?.reduce(
//         (acc, address) => {
//           acc[address] = true;
//           return acc;
//         },
//         {} as Record<string, boolean>
//       ),
//     };
//   }, [linkedSmartWalletAddresses]);

//   const queryClient = useQueryClient();

//   // Mutation with optimistic updates
//   const mutation = useMutation({
//     mutationFn: async (newMetadata: IPrivyCustomMetadata) => {
//       logger.debug(`[updateMetadata] Starting mutation for user: ${user?.id}`);
//       if (!user?.id) throw new Error("User not authenticated");

//       const privyAppId = "PRIVY_APP_ID";
//       const privyAppSecret = "PRIVY_APP_SECRET";
//       const authString = btoa(`${privyAppId}:${privyAppSecret}`);

//       // Stringify the nested object structure
//       const stringifiedMetadata = {
//         inboxActiveByInstallation: JSON.stringify(
//           newMetadata.inboxActiveByInstallation
//         ),
//       };

//       logger.debug(
//         `[updateMetadata] Making API request to update metadata for user: ${user.id}`
//       );

//       const response = await fetch(
//         `https://auth.privy.io/api/v1/users/${user.id}/custom_metadata`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Basic ${authString}`,
//             "privy-app-id": privyAppId,
//           },
//           body: JSON.stringify({
//             custom_metadata: stringifiedMetadata,
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         logger.error(
//           `[updateMetadata] API request failed with status: ${response.status}`
//         );
//         // @ts-ignore
//         throw new Error(errorData.message || "Failed to update metadata");
//       }

//       const responseJson = await response.json();
//       logger.debug(
//         `[updateMetadata] Updated custom metadata for user ${
//           user.id
//         }: ${JSON.stringify(responseJson)}`
//       );

//       // @ts-ignore
//       return privyCustomMetadataSchema.parse(responseJson.custom_metadata);
//     },

//     onMutate: async (newMetadata) => {
//       logger.debug(`[updateMetadata] Starting optimistic update`);
//       const queryKey = privyCustomMetadataQueryKey(user?.id);
//       await queryClient.cancelQueries({ queryKey });
//       const previousMetadata =
//         queryClient.getQueryData<IPrivyCustomMetadata>(queryKey);
//       queryClient.setQueryData(queryKey, newMetadata);
//       logger.debug(`[updateMetadata] Completed optimistic update`);
//       return { previousMetadata };
//     },

//     onError: (error, variables, context) => {
//       logger.error(
//         `Failed to update custom metadata: ${error}, ${JSON.stringify(
//           variables,
//           null,
//           2
//         )}`
//       );
//       const queryKey = privyCustomMetadataQueryKey(user?.id);
//       queryClient.setQueryData(queryKey, context?.previousMetadata);
//       logger.debug(`[updateMetadata] Rolled back to previous metadata state`);
//     },

//     onSettled: () => {
//       logger.debug(`[updateMetadata] Mutation settled, invalidating queries`);
//       const queryKey = privyCustomMetadataQueryKey(user?.id);
//       // queryClient.invalidateQueries({ queryKey });
//     },
//   });

//   const getPrivyCustomMetadata: (
//     userId: string
//   ) => Promise<IPrivyCustomMetadata> = useCallback(
//     async (userId: string) => {
//       logger.debug(
//         `[getPrivyCustomMetadata] Fetching custom metadata for user: ${userId}`
//       );

//       const privyAppId = "cloh5bn1p00q4l50gcg0g1mix";
//       const privyAppSecret =
//         "yFEN4Pcd2FnqFjJTCysHscejnBpDvMGeFLj4ajfQN5nxfQcSQVAofZoH65MmCr1kwtJKNnyGxow1hjow8f2rrnq";
//       const authString = btoa(`${privyAppId}:${privyAppSecret}`);

//       const response = await fetch(
//         `https://auth.privy.io/api/v1/users/${userId}`,
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Basic ${authString}`,
//             "privy-app-id": privyAppId,
//           },
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         logger.error(
//           `[getPrivyCustomMetadata] API request failed with status: ${response.status}`
//         );
//         throw new Error(errorData.message || "Failed to fetch metadata");
//       }

//       const responseJson = await response.json();
//       const parsedResponse = privyUserResponseSchema.parse(responseJson);

//       // If custom_metadata is empty or doesn't exist, use defaultMetadata
//       if (!parsedResponse.custom_metadata?.inboxActiveByInstallation) {
//         logger.debug(
//           `[getPrivyCustomMetadata] No existing metadata found, using default metadata`
//         );

//         // Use the mutation to set the default metadata
//         await mutation.mutateAsync(defaultMetadata);
//         return defaultMetadata;
//       }

//       const result = privyCustomMetadataSchema.safeParse(
//         parsedResponse.custom_metadata
//       );

//       if (result.success) {
//         logger.debug(
//           `[getPrivyCustomMetadata] Successfully parsed custom metadata for user: ${userId}`
//         );
//         return result.data;
//       }

//       logger.debug(
//         `[getPrivyCustomMetadata] Invalid custom metadata structure for user ${userId}, using default metadata`
//       );

//       // Use the mutation to set the default metadata
//       await mutation.mutateAsync(defaultMetadata);
//       return defaultMetadata;
//     },
//     [defaultMetadata, mutation]
//   );

//   const {
//     data: validatedPrivyMetadata,
//     isLoading,
//     error,
//   } = useQuery(
//     getPrivyCustomMetadataQueryOptions({
//       privyUserId: user?.id,
//       getPrivyCustomMetadata,
//     })
//   );

//   return {
//     customMetadata: validatedPrivyMetadata,
//     updateMetadata: mutation.mutateAsync,
//     isUpdating: mutation.isPending,
//     error: mutation.error?.message,
//   };
// }
