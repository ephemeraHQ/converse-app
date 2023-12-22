import {
  ContentTypeId,
  EncodedContent,
  JSContentCodec,
} from "@xmtp/react-native-sdk";

export const ContentTypeTransactionReference: ContentTypeId = {
  authorityId: "xmtp.org",
  typeId: "transactionReference",
  versionMajor: 1,
  versionMinor: 0,
};

export type TransactionReference = {
  /**
   * The namespace for the networkId
   */
  namespace?: string;
  /**
   * The networkId for the transaction, in decimal or hexidecimal format
   */
  networkId: number | string;
  /**
   * The transaction hash
   */
  reference: string;
  /**
   * Optional metadata object
   */
  metadata?: {
    transactionType: string;
    currency: string;
    amount: number;
    fromAddress: string;
    toAddress: string;
  };
};

export class TransactionReferenceCodec
  implements JSContentCodec<TransactionReference>
{
  get contentType(): ContentTypeId {
    return ContentTypeTransactionReference;
  }

  encode(content: TransactionReference): EncodedContent {
    const { namespace, networkId, reference, metadata } = content;
    return {
      type: ContentTypeTransactionReference,
      parameters: {},
      content: new TextEncoder().encode(
        JSON.stringify({ namespace, networkId, reference, metadata })
      ),
    };
  }

  decode(encodedContent: EncodedContent): TransactionReference {
    const decodedContent = new TextDecoder().decode(encodedContent.content);
    const content = JSON.parse(decodedContent) as TransactionReference;
    const { namespace, networkId, reference, metadata } = content;
    return { namespace, networkId, reference, metadata };
  }

  fallback(content: TransactionReference): string | undefined {
    return `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: ${content.reference}`;
  }
}
