import { PermissionOption } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet"

export const memberCanUpdateGroup = (
  fieldPermission: PermissionOption | undefined,
  isAdmin: boolean,
  isSuperAdmin: boolean,
) => {
  if (fieldPermission === "deny") {
    return false
  }
  if (fieldPermission === "allow") {
    return true
  }

  if (fieldPermission === "admin") {
    return isAdmin || isSuperAdmin
  }

  if (fieldPermission === "superAdmin") {
    return isSuperAdmin
  }
  if (!fieldPermission) {
    return false
  }
  // unknown
  return isAdmin || isSuperAdmin
}
