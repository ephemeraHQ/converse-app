## SpecStory

## Fixing Test for Random Output Function (1/27/2025, 9:35:22 AM)

_**User**_

this test dones't work because formatGroupName will return a random 3 words string. Look at @str.ts 

---

_**Assistant**_

Ah, I see the issue. The test is expecting a specific string output ("Utah bluebird delta") but since `humanize()` generates random words based on the input hash, we can't predict the exact output. Let's modify the test to verify the format rather than the specific words.

Here's how we can update the test:

```typescript:utils/str.test.ts
// ... existing code ...

describe("formatGroupName", () => {
  it("should return groupName if provided", () => {
    const topic = "randomTopicString";
    const groupName = "MyGroupName";
    const result = formatGroupName(topic, groupName);
    expect(result).toBe(groupName);
  });

  it("should format topic into three capitalized words if groupName is not provided", () => {
    const topic = "/xmtp/mls/1/g-dab181fefd94578cc791bcc42d3b207c/proto";
    const result = formatGroupName(topic);

    // Check that we get three space-separated words
    const words = result.split(" ");
    expect(words).toHaveLength(3);

    // Check that each word is capitalized
    words.forEach(word => {
      expect(word[0]).toMatch(/[A-Z]/);
      expect(word.slice(1)).toMatch(/^[a-z]+$/);
    });
  });
});
```

The updated test now verifies that:
1. The result contains exactly 3 words separated by spaces
2. Each word starts with a capital letter
3. The rest of each word contains only lowercase letters

This makes the test more robust since it checks the format rather than specific content that could change based on the random word generation.

---



---

