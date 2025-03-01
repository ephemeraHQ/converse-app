import { z } from "zod"

export const profileValidationSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9\s]+$/, {
      message: "Name can only contain letters, numbers and spaces",
    }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(50, { message: "Username cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: "Username can only contain letters, numbers and dashes",
    }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  avatar: z.string().url({ message: "Avatar must be a valid URL" }).optional(),
})

export type IProfileValidation = z.infer<typeof profileValidationSchema>
