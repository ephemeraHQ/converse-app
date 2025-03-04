function mockedClient() {
  return {
    conversations: {
      streamAllMessages: jest.fn(() => {}),
      cancelStreamAllMessages: jest.fn(() => {}),
      cancelStream: jest.fn(() => {}),
    },
    exportKeyBundle: jest.fn(() => "keybundle"),
    canMessage: jest.fn(() => true),
  }
}

module.exports = {
  Client: {
    createFromKeyBundle: jest.fn().mockImplementation(mockedClient),
    createRandom: jest.fn().mockImplementation(mockedClient),
  },
  StaticAttachmentCodec: jest.fn().mockImplementation(() => {
    return {}
  }),
  RemoteAttachmentCodec: jest.fn().mockImplementation(() => {
    return {}
  }),
  JSContentCodec: jest.fn().mockImplementation(() => {
    return {}
  }),
  GroupUpdatedCodec: jest.fn().mockImplementation(() => {
    return {}
  }),
  ReplyCodec: jest.fn().mockImplementation(() => ({})),
  ReactionCodec: jest.fn().mockImplementation(() => ({})),
  emitter: { removeAllListeners: jest.fn(() => {}) },
}
