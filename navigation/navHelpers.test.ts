import { getConverseStateFromPath } from "./navHelpers";

jest.mock("../../components/StateHandlers/InitialStateHandler", () => ({
  initialURL: "",
}));

describe("getConverseStateFromPath", () => {
  const navConfig = {
    initialRouteName: "Chats",
    screens: {
      Chats: "/",
      Conversation: {
        path: "/conversation",
      },
      NewConversation: {
        path: "/newConversation",
      },
      Profile: {
        path: "/profile",
      },
      Group: {
        path: "/group",
      },
      GroupLink: {
        path: "/groupLink/:groupLinkId",
      },
      GroupInvite: {
        path: "/group-invite/:groupInviteId",
      },
      ShareProfile: {
        path: "/shareProfile",
      },
      WebviewPreview: {
        path: "/webviewPreview",
      },
    },
  };

  it("should parse simple dm deeplink", () => {
    const state = getConverseStateFromPath("testNav")(
      "dm?peer=0xno12.eth",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).mainConversationWithPeer).toBe("0xno12.eth");
    expect((route?.params as any).text).toBeUndefined();
  });

  it("should parse simple dm universal link", () => {
    const state = getConverseStateFromPath("testNav")(
      "dm/0xno12.eth",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).mainConversationWithPeer).toBe("0xno12.eth");
    expect((route?.params as any).text).toBeUndefined();
  });

  it("should parse simple group deeplink", () => {
    const state = getConverseStateFromPath("testNav")(
      "group?groupId=f7349f84925aaeee5816d02b7798efbc",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).topic).toBe(
      "/xmtp/mls/1/g-f7349f84925aaeee5816d02b7798efbc/proto"
    );
    expect((route?.params as any).text).toBeUndefined();
  });

  it("should parse simple group universal link", () => {
    const state = getConverseStateFromPath("testNav")(
      "group/f7349f84925aaeee5816d02b7798efbc",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).topic).toBe(
      "/xmtp/mls/1/g-f7349f84925aaeee5816d02b7798efbc/proto"
    );
    expect((route?.params as any).text).toBeUndefined();
  });

  it("should parse simple dm deeplink with text", () => {
    const state = getConverseStateFromPath("testNav")(
      "dm?peer=0xno12.eth&text=hello",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).mainConversationWithPeer).toBe("0xno12.eth");
    expect((route?.params as any).text).toBe("hello");
  });

  it("should parse simple dm universal link with text", () => {
    const state = getConverseStateFromPath("testNav")(
      "dm/0xno12.eth?text=hello",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).mainConversationWithPeer).toBe("0xno12.eth");
    expect((route?.params as any).text).toBe("hello");
  });

  it("should parse simple group deeplink with text", () => {
    const state = getConverseStateFromPath("testNav")(
      "group?groupId=f7349f84925aaeee5816d02b7798efbc&text=hello",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).topic).toBe(
      "/xmtp/mls/1/g-f7349f84925aaeee5816d02b7798efbc/proto"
    );
    expect((route?.params as any).text).toBe("hello");
  });

  it("should parse simple group universal link with text", () => {
    const state = getConverseStateFromPath("testNav")(
      "group/f7349f84925aaeee5816d02b7798efbc?text=hello",
      navConfig
    );
    const route = state?.routes[state.routes.length - 1];
    expect(route?.name).toBe("Conversation");
    expect((route?.params as any).topic).toBe(
      "/xmtp/mls/1/g-f7349f84925aaeee5816d02b7798efbc/proto"
    );
    expect((route?.params as any).text).toBe("hello");
  });
});
