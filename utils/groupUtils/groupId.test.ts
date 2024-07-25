import { getGroupIdFromTopic } from "./groupId";

describe("getGroupIdFromTopic", () => {
  it("should return the group id from a topic", () => {
    const topic = "/xmtp/mls/1/g-854565fa1fbb235e241a80e370095740/proto";
    const groupId = getGroupIdFromTopic(topic);
    expect(groupId).toBe("854565fa1fbb235e241a80e370095740");
  });

  it("should return the group id from a topic", () => {
    const topic = "854565fa1fbb235e241a80e370095740";
    const groupId = getGroupIdFromTopic(topic);
    expect(groupId).toBe("854565fa1fbb235e241a80e370095740");
  });
});
