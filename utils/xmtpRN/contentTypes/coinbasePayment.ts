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
      content: new TextEncoder().encode(JSON.stringify(content)),
    };
  }
  decode(encodedContent: EncodedContent): CoinbaseMessagingPaymentContent {
    const uint8Array = encodedContent.content;
    return JSON.parse(
      new TextDecoder().decode(uint8Array)
    ) as CoinbaseMessagingPaymentContent;
  }

  fallback(content: CoinbaseMessagingPaymentContent): string | undefined {
    return "A Coinbase payment.";
  }
}
