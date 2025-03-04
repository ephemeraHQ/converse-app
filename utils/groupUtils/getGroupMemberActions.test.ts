import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet"
import { getGroupMemberActions } from "./getGroupMemberActions"

describe("getGroupMemberActions", () => {
  test("should return correct actions when user can promote to admin", () => {
    const result = getGroupMemberActions({
      groupPermissionLevel: {
        addAdminPolicy: "allow",
      } as PermissionPolicySet,
      isCurrentUser: false,
      isSuperAdmin: false,
      isAdmin: false,
      currentAccountIsSuperAdmin: true,
      currentAccountIsAdmin: true,
    })

    expect(result.options).toContain("Promote to admin")
  })

  test("should return correct actions when user can promote to super admin", () => {
    const result = getGroupMemberActions({
      groupPermissionLevel: {
        addAdminPolicy: "allow",
      } as PermissionPolicySet,
      isCurrentUser: false,
      isSuperAdmin: false,
      isAdmin: false,
      currentAccountIsSuperAdmin: true,
      currentAccountIsAdmin: true,
    })

    expect(result.options).toContain("Promote to super admin")
  })

  test("should return correct actions when user can revoke admin", () => {
    const result = getGroupMemberActions({
      groupPermissionLevel: {
        removeAdminPolicy: "allow",
      } as PermissionPolicySet,
      isCurrentUser: false,
      isSuperAdmin: false,
      isAdmin: true,
      currentAccountIsSuperAdmin: true,
      currentAccountIsAdmin: true,
    })

    expect(result.options).toContain("Revoke admin")
  })

  test("should return correct actions when user can revoke super admin", () => {
    const result = getGroupMemberActions({
      groupPermissionLevel: {
        addAdminPolicy: "allow",
      } as PermissionPolicySet,
      isCurrentUser: false,
      isSuperAdmin: true,
      isAdmin: false,
      currentAccountIsSuperAdmin: true,
      currentAccountIsAdmin: true,
    })

    expect(result.options).toContain("Revoke super admin")
  })

  test("should return correct actions when user can remove from group", () => {
    const result = getGroupMemberActions({
      groupPermissionLevel: {
        removeMemberPolicy: "allow",
      } as PermissionPolicySet,
      isCurrentUser: false,
      isSuperAdmin: false,
      isAdmin: false,
      currentAccountIsSuperAdmin: true,
      currentAccountIsAdmin: true,
    })

    expect(result.options).toContain("Remove from group")
  })

  test("should not include admin actions for the current user", () => {
    const result = getGroupMemberActions({
      groupPermissionLevel: {
        addAdminPolicy: "allow",
      } as PermissionPolicySet,
      isCurrentUser: true,
      isSuperAdmin: false,
      isAdmin: false,
      currentAccountIsSuperAdmin: true,
      currentAccountIsAdmin: true,
    })

    expect(result.options).not.toContain("Promote to admin")
    expect(result.options).not.toContain("Promote to super admin")
    expect(result.options).not.toContain("Revoke admin")
    expect(result.options).not.toContain("Revoke super admin")
    expect(result.options).not.toContain("Remove from group")
  })
})
