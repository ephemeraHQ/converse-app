test.todo("next pr");
// import { generateGroupHashFromMemberIds } from "@/features/create-conversation/generate-group-hash-from-member-ids";

// /**
//  * Tests for generateGroupHashFromMemberIds utility function
//  *
//  * These tests verify that the function generates consistent,
//  * deterministic hashes from arrays of member IDs regardless
//  * of input order. The hash is used to uniquely identify
//  * group chats based on their members.
//  *
//  * @example
//  * // Input: ['123', '456']
//  * // Output: 'a1b2c3' (consistent hash)
//  *
//  * @example
//  * // Input: ['456', '123'] (different order)
//  * // Output: 'a1b2c3' (same hash)
//  */

// describe("generateGroupHashFromMemberIds", () => {
//   /**
//    * Test basic hash generation with simple member IDs
//    */
//   test("generates consistent hash for basic member IDs", () => {
//     const memberIds = ["user1", "user2", "user3"];
//     const result = generateGroupHashFromMemberIds(memberIds);

//     expect(typeof result).toBe("string");
//     expect(result.length).toBeGreaterThan(0);
//   });

//   /**
//    * Verify hash is consistent regardless of member ID order
//    */
//   test("generates same hash regardless of member order", () => {
//     const hash1 = generateGroupHashFromMemberIds(["user1", "user2", "user3"]);
//     const hash2 = generateGroupHashFromMemberIds(["user2", "user3", "user1"]);
//     const hash3 = generateGroupHashFromMemberIds(["user3", "user1", "user2"]);

//     expect(hash1).toBe(hash2);
//     expect(hash2).toBe(hash3);
//   });

//   /**
//    * Test handling of empty input array
//    */
//   test("handles empty member array", () => {
//     expect(() => generateGroupHashFromMemberIds([])).toThrow();
//   });

//   /**
//    * Verify unique hashes for different member combinations
//    */
//   test("generates different hashes for different members", () => {
//     const hash1 = generateGroupHashFromMemberIds(["user1", "user2"]);
//     const hash2 = generateGroupHashFromMemberIds(["user2", "user3"]);
//     const hash3 = generateGroupHashFromMemberIds(["user1", "user2", "user3"]);

//     expect(hash1).not.toBe(hash2);
//     expect(hash2).not.toBe(hash3);
//     expect(hash1).not.toBe(hash3);
//   });

//   /**
//    * Test handling of duplicate member IDs
//    */
//   test("handles duplicate member IDs", () => {
//     const hash1 = generateGroupHashFromMemberIds(["user1", "user2", "user2"]);
//     const hash2 = generateGroupHashFromMemberIds(["user1", "user2"]);

//     expect(hash1).toBe(hash2);
//   });

//   /**
//    * Verify handling of special characters in member IDs
//    */
//   test("handles special characters in member IDs", () => {
//     const memberIds = ["user@1", "user#2", "user$3"];
//     const result = generateGroupHashFromMemberIds(memberIds);

//     expect(typeof result).toBe("string");
//     expect(result.length).toBeGreaterThan(0);
//   });
// });
