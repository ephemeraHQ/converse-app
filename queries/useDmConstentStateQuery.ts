import { useConversationQuery } from "@/queries/useConversationQuery";
import { useQuery } from "@tanstack/react-query";
import { ConsentState, type ConversationTopic } from "@xmtp/react-native-sdk";
import { dmConsentQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

type DmConsentQueryData = ConsentState;

export const useDmConsentQuery = (args: {
  account: string;
  topic: ConversationTopic | undefined;
}) => {
  const { account, topic } = args;
  const { data: dmConversation } = useConversationQuery(account, topic!);

  return useQuery({
    queryKey: dmConsentQueryKey(account, topic!),
    queryFn: () => dmConversation!.consentState(),
    enabled: !!dmConversation && !!topic,
    initialData: dmConversation?.state,
  });
};

export const getDmConsentQueryData = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return queryClient.getQueryData<DmConsentQueryData>(
    dmConsentQueryKey(account, topic)
  );
};

export const setDmConsentQueryData = (args: {
  account: string;
  topic: ConversationTopic;
  consent: Consent;
}) => {
  const { account, topic, consent } = args;
  queryClient.setQueryData<DmConsentQueryData>(
    dmConsentQueryKey(account, topic),
    consent
  );
};

export const cancelDmConsentQuery = async (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  await queryClient.cancelQueries({
    queryKey: dmConsentQueryKey(account, topic),
  });
};
