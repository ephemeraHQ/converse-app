import { searchByConversationMembership } from "./search-by-conversation-membership";

describe("searchByConversationMembership", () => {
  test("searchByConversationMembership", async () => {
    // expect(false).toBe(true);
    const result = await searchByConversationMembership({
      searchQuery: "test",
    });
    expect(result).toBeDefined();
  });
});
