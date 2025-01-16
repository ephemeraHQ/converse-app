export const CreateConversationScreenConfig = {
  path: "/createConversation",
  parse: {
    peer: decodeURIComponent,
  },
  stringify: {
    peer: encodeURIComponent,
  },
};
