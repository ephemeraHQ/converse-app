import {
  ContentTypeId,
  EncodedContent,
  JSContentCodec,
} from "@xmtp/react-native-sdk";

const ContentTypeCoinbasePayment: ContentTypeId = {
  authorityId: "coinbase.com",
  typeId: "coinbase-messaging-payment-activity",
  versionMajor: 1,
  versionMinor: 0,
};

type CoinbaseMessagingRegularPaymentContent = {
  currencyCode: {
    code: string;
    rawValue: string;
  };
  fromAddress: string;
  network: {
    isTestnet: boolean;
    rawValue: string;
  };
  toAddress: string;
  transactionHash: string;
};

type CoinbaseMessagingSponsoredPaymentContent = {
  fromAddress: string;
  network: {
    isTestnet: boolean;
    rawValue: string;
  };
  sponsoredTxId: string;
  toAddress: string;
};

export type CoinbaseMessagingPaymentContent =
  | CoinbaseMessagingRegularPaymentContent
  | CoinbaseMessagingSponsoredPaymentContent;

export class CoinbaseMessagingPaymentCodec
  implements JSContentCodec<CoinbaseMessagingPaymentContent>
{
  contentType = ContentTypeCoinbasePayment;

  encode(content: CoinbaseMessagingPaymentContent): EncodedContent {
    return {
      type: ContentTypeCoinbasePayment,
      parameters: {},
      content: Buffer.from(JSON.stringify(content)).toString("base64") as any,
    };
  }
  decode(encodedContent: EncodedContent): CoinbaseMessagingPaymentContent {
    // Handling content that is base64 encoded rather than Buffer
    const base64Content = encodedContent.content as unknown as string;
    const stringContent = Buffer.from(base64Content, "base64").toString();
    return JSON.parse(stringContent) as CoinbaseMessagingPaymentContent;
  }

  fallback(content: CoinbaseMessagingPaymentContent): string | undefined {
    return "A Coinbase payment.";
  }
}
