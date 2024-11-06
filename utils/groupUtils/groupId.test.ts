import { getV3IdFromTopic, isV3Topic } from "./groupId";

describe("getV3IdFromTopic", () => {
  it("should return the group id from a topic", () => {
    const topic = "/xmtp/mls/1/g-854565fa1fbb235e241a80e370095740/proto";
    const groupId = getV3IdFromTopic(topic);
    expect(groupId).toBe("854565fa1fbb235e241a80e370095740");
  });

  it("should return the group id from a topic", () => {
    const topic = "854565fa1fbb235e241a80e370095740";
    const groupId = getV3IdFromTopic(topic);
    expect(groupId).toBe("854565fa1fbb235e241a80e370095740");
  });
});

describe("isV3Topic", () => {
  it("should return true if the topic is a v3 topic", () => {
    const topic = "/xmtp/mls/1/g-854565fa1fbb235e241a80e370095740/proto";
    const isV3 = isV3Topic(topic);
    expect(isV3).toBe(true);
  });

  it("should return false if the topic is intro topic", () => {
    const topic = "/xmtp/0/intro-854565fa1fbb235e241a80e370095740/proto";
    const isV3 = isV3Topic(topic);
    expect(isV3).toBe(false);
  });

  it("should return false if the topic is invite topic", () => {
    const topic = "/xmtp/0/invite-854565fa1fbb235e241a80e370095740/proto";
    const isV3 = isV3Topic(topic);
    expect(isV3).toBe(false);
  });

  it("should return false if the topic is welcome topic", () => {
    const topic = "/xmtp/mls/1/w--854565fa1fbb235e241a80e370095740/proto";
    const isV3 = isV3Topic(topic);
    expect(isV3).toBe(false);
  });
});
