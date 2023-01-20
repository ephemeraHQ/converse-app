import { Client, Conversation } from "@xmtp/xmtp-js";
import * as SecureStore from "expo-secure-store";
import React, { useEffect } from "react";
import { View } from "react-native";

import config from "../config";

const xmtpEnv = config.xmtpEnv === "production" ? "production" : "dev";

const getMessages = async (conversation: Conversation) => {
  const now = new Date().getTime();
  const messages = await conversation.messages();
  const after = new Date().getTime();
  const duration = (after - now) / 1000;
  console.log(`Getting ${messages.length} messages took ${duration} seconds`);
};

export default function XmtpTest() {
  useEffect(() => {
    const loadKeys = async () => {
      const keys = await SecureStore.getItemAsync("XMTP_KEYS");
      if (!keys) return;
      const client = await Client.create(null, {
        privateKeyOverride: Buffer.from(JSON.parse(keys)),
        env: xmtpEnv,
      });
      const now = new Date().getTime();
      // await client.conversations.import(JSON.parse(conversationsExport));
      console.log("Getting the conversations...");
      const convos = await client.conversations.list();
      console.log(`Done - ${convos.length} convos`);
      await Promise.all(convos.map(getMessages));
      const after = new Date().getTime();
      const duration = (after - now) / 1000;
      console.log(`LISTING ${convos.length} CONVOS TOOK ${duration} seconds`);
    };
    loadKeys();
  }, []);
  return <View />;
}
