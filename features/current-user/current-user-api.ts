import { api } from "@/utils/api/api";
import { z } from "zod";

export const CurrentUserSchema = z.object({
  id: z.string(),
  privyUserId: z.string(),
  device: z.object({
    id: z.string(),
    os: z.string(),
    name: z.string().nullable(),
  }),
  identity: z.object({
    id: z.string(),
    privyAddress: z.string(),
    xmtpId: z.string(),
  }),
  profile: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  }),
});

export type ICurrentUser = z.infer<typeof CurrentUserSchema>;

export async function fetchCurrentUser(): Promise<ICurrentUser> {
  // todo what's the endpoint
  const { data } = await api.get("/api/v1/user/me");
  return CurrentUserSchema.parse(data);
}
