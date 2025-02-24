// import { ContentTypeId } from "@xmtp/content-type-primitives";
// import type {
//   ContentCodec,
//   EncodedContent,
// } from "@xmtp/content-type-primitives";

// const ContentTypeCoinbasePayment = new ContentTypeId({
//   authorityId: "coinbase.com",
//   typeId: "coinbase-messaging-payment-activity",
//   versionMajor: 1,
//   versionMinor: 0,
// });

// type CoinbaseMessagingRegularPaymentContent = {
//   currencyCode: {
//     code: string;
//     rawValue: string;
//   };
//   fromAddress: string;
//   network: {
//     isTestnet: boolean;
//     rawValue: string;
//   };
//   toAddress: string;
//   transactionHash: string;
// };

// type CoinbaseMessagingSponsoredPaymentContent = {
//   fromAddress: string;
//   network: {
//     isTestnet: boolean;
//     rawValue: string;
//   };
//   sponsoredTxId: string;
//   toAddress: string;
// };

// export type CoinbaseMessagingPaymentContent =
//   | CoinbaseMessagingRegularPaymentContent
//   | CoinbaseMessagingSponsoredPaymentContent;

// export class CoinbaseMessagingPaymentCodec
//   implements ContentCodec<CoinbaseMessagingPaymentContent>
// {
//   contentType = ContentTypeCoinbasePayment;

//   encode(content: CoinbaseMessagingPaymentContent): EncodedContent {
//     return {
//       type: ContentTypeCoinbasePayment,
//       parameters: {},
//       content: new TextEncoder().encode(JSON.stringify(content)),
//     };
//   }

//   decode(encodedContent: EncodedContent): CoinbaseMessagingPaymentContent {
//     const uint8Array = encodedContent.content;
//     const contentReceived = JSON.parse(new TextDecoder().decode(uint8Array));
//     return contentReceived as CoinbaseMessagingPaymentContent;
//   }

//   fallback(content: CoinbaseMessagingPaymentContent): string | undefined {
//     return "A Coinbase payment.";
//   }

//   shouldPush() {
//     return true;
//   }
// }
