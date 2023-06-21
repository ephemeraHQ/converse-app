import * as Linking from "expo-linking";

export const POPULAR_WALLETS = [
  {
    name: "Rainbow",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://rnbwapp.com",
  },
  {
    name: "Ledger Live",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://www.ledger.com/ledger-live",
  },
  {
    name: "Coinbase Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://www.coinbase.com/wallet/",
  },
  {
    name: "MetaMask",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/5195e9db-94d8-4579-6f11-ef553be95100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://metamask.app.link",
  },
  {
    name: "Trust Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/0528ee7e-16d1-4089-21e3-bbfb41933100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://trustology.io/",
  },
  {
    name: "Zerion",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/f216b371-96cf-409a-9d88-296392b85800?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://wallet.zerion.io",
  },
];

export type InstalledWallet = {
  name: string;
  iconURL: string;
  customScheme: string;
  universalLink?: string;
  isMetaMask?: boolean;
  isCoinbase?: boolean;
  walletConnectId?: string;
  decodeWalletConnectURI?: boolean;
};

const SUPPORTED_WALLETS: InstalledWallet[] = [
  {
    name: "Coinbase Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "cbwallet://",
    isCoinbase: true,
  },
  {
    name: "Ledger Live",
    walletConnectId:
      "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "ledgerlive://",
    decodeWalletConnectURI: true,
  },
  {
    name: "Rainbow",
    walletConnectId:
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "rainbow://",
  },
  {
    name: "MetaMask",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/5195e9db-94d8-4579-6f11-ef553be95100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "metamask://",
    isMetaMask: true,
  },
  {
    name: "Trust Wallet",
    walletConnectId:
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/0528ee7e-16d1-4089-21e3-bbfb41933100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "trust://",
  },
  {
    name: "Uniswap Wallet",
    walletConnectId:
      "c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/bff9cf1f-df19-42ce-f62a-87f04df13c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "uniswap://",
  },
  {
    name: "Zerion",
    walletConnectId:
      "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/f216b371-96cf-409a-9d88-296392b85800?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "zerion://",
  },
  {
    name: "imToken",
    walletConnectId:
      "ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/99520548-525c-49d7-fb2f-5db65293b000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "imtokenv2://",
    decodeWalletConnectURI: true,
  },
  {
    name: "MEW wallet",
    walletConnectId:
      "f5b4eeb6015d66be3f5940a895cbaa49ef3439e518cd771270e6b553b48f31d2",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/e2024511-2c9b-46d7-3111-52df3d241700?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "mewwallet://",
  },
  {
    name: "Exodus",
    walletConnectId:
      "e9ff15be73584489ca4a66f64d32c4537711797e30b6660dbcb71ea72a42b1f4",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/4c16cad4-cac9-4643-6726-c696efaf5200?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "exodus://",
    universalLink: "https://exodus.com/m",
  },
  // {
  //   name: "Spot",
  //   walletConnectId:
  //     "74f8092562bd79675e276d8b2062a83601a4106d30202f2d509195e30e19673d",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/1bf33a89-b049-4a1c-d1f6-4dd7419ee400?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "spot://",
  // },
  // {
  //   name: "Omni",
  //   walletConnectId:
  //     "afbd95522f4041c71dd4f1a065f971fd32372865b416f95a0b1db759ae33f2a7",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/2cd67b4c-282b-4809-e7c0-a88cd5116f00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "omni://",
  // },
  // {
  //   name: "BitKeep",
  //   walletConnectId:
  //     "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/3f7075d0-4ab7-4db5-404d-3e4c05e6fe00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "bitkeep://",
  // },
  // {
  //   name: "Robinhood Wallet",
  //   walletConnectId:
  //     "8837dd9413b1d9b585ee937d27a816590248386d9dbf59f5cd3422dbbb65683e",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/dfe0e3e3-5746-4e2b-12ad-704608531500?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "robinhood-wallet://",
  // },
  // {
  //   name: "Crypto.com | DeFi Wallet",
  //   walletConnectId:
  //     "f2436c67184f158d1beda5df53298ee84abfc367581e4505134b5bcf5f46697d",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/7c5ff577-a68d-49c5-02cd-3d83637b0b00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "crypto://",
  // },
  // {
  //   name: "AlphaWallet",
  //   walletConnectId:
  //     "138f51c8d00ac7b9ac9d8dc75344d096a7dfe370a568aa167eabc0a21830ed98",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/5b1cddfb-056e-4e78-029a-54de5d70c500?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "awallet://",
  // },
  // {
  //   name: "SafePal",
  //   walletConnectId:
  //     "0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/252753e7-b783-4e03-7f77-d39864530900?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "safepalwallet://",
  // },
  // {
  //   name: "MathWallet",
  //   walletConnectId:
  //     "7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291218ebd90f5f5e26",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/26a8f588-3231-4411-60ce-5bb6b805a700?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "mathwallet://",
  // },
  // {
  //   name: "TokenPocket",
  //   walletConnectId:
  //     "20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/f3119826-4ef5-4d31-4789-d4ae5c18e400?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "tpoutside://",
  // },
  // {
  //   name: "KEYRING PRO",
  //   walletConnectId:
  //     "47bb07617af518642f3413a201ec5859faa63acb1dd175ca95085d35d38afb83",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/dda0f0fb-34e8-4a57-dcea-b008e7d1ff00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "keyring://",
  // },
  // {
  //   name: "Frontier",
  //   walletConnectId:
  //     "85db431492aa2e8672e93f4ea7acf10c88b97b867b0d373107af63dc4880f041",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/a78c4d48-32c1-4a9d-52f2-ec7ee08ce200?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "frontier://",
  // },
  // {
  //   name: "Binance DeFi Wallet",
  //   walletConnectId:
  //     "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/ebac7b39-688c-41e3-7912-a4fefba74600?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "bnc://app.binance.com/cedefi/",
  // },

  // {
  //   name: "ZenGo Wallet",
  //   walletConnectId:
  //     "9414d5a85c8f4eabc1b5b15ebe0cd399e1a2a9d35643ab0ad22a6e4a32f596f0",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/cfc07342-23ea-4f3f-f071-ec9d2cd86b00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "zengo://get.zengo.com/",
  // },
  // {
  //   name: "Fireblocks",
  //   walletConnectId:
  //     "5864e2ced7c293ed18ac35e0db085c09ed567d67346ccb6f58a0327a75137489",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/7e1514ba-932d-415d-1bdb-bccb6c2cbc00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "fireblocks-wc://",
  // },
  // {
  //   name: "Unstoppable Domains",
  //   walletConnectId:
  //     "8308656f4548bb81b3508afe355cfbb7f0cb6253d1cc7f998080601f838ecee3",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/4725dda0-4471-4d0f-7adf-6bbe8b929c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "unstoppabledomains://",
  // },

  // {
  //   name: "3S Wallet",
  //   walletConnectId:
  //     "6d1d5b892e02d4c992ae67f18f522398481360c64269f5cdf5e4b80435b20e3d",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/f3b6a89d-ec8f-49dc-e07f-6bf723e1e500?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "bhcwallet://",
  // },
  // {
  //   name: "Loopring Wallet",
  //   walletConnectId:
  //     "3968c3f5e1aa69375e71bfc3da08a1d24791ac0b3d1c3b1c7e3a2676d175c856",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/2103feda-4fc8-4635-76a7-02a4ed998000?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "loopring://",
  // },
  // {
  //   name: "helix id",
  //   walletConnectId:
  //     "48e53d96460308a1734614b5d4fdf7ea169e6f998e01eb7b4e18014f57904d67",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/4083ef71-8389-4682-ded6-0099236d2e00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "helix-id://helix-id.com",
  // },
  // {
  //   name: "Pitaka",
  //   walletConnectId:
  //     "14e5d957c6eb62d3ee8fc6239703ac2d537d7e3552154836ca0beef775f630bc",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/691c0716-5213-4b99-e837-079268313800?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "pitaka://",
  // },
  // {
  //   name: "Kriptomat",
  //   walletConnectId:
  //     "01925725cdc7a5008824c8f19eff85769903fbcc53c62639feb0d4f8d3a6cf52",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/774110aa-70f6-4d0c-210f-ab434838fa00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "kriptomatapp://wallet-connect",
  // },
  // {
  //   name: "Bitizen",
  //   walletConnectId:
  //     "41f20106359ff63cf732adf1f7dc1a157176c9b02fd266b50da6dcc1e9b86071",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/75dd1471-77e9-4811-ce57-ec8fc980ec00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "bitizen://wallet",
  // },
  // {
  //   name: "Coin98 Super App",
  //   walletConnectId:
  //     "2a3c89040ac3b723a1972a33a125b1db11e258a6975d3a61252cd64e6ea5ea01",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/fc460647-ea95-447a-99f0-1bff8fa4be00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "wc://",
  // },
  // {
  //   name: "Timeless Wallet",
  //   walletConnectId:
  //     "9751385960bca290c13b443155288f892f62ee920337eda8c5a8874135daaea8",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/32e89601-0490-42fc-0cc4-8627d62a2000?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "timeless-wallet://",
  // },
  // {
  //   name: "OKX Wallet",
  //   walletConnectId:
  //     "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/45f2f08e-fc0c-4d62-3e63-404e72170500?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "okex://main",
  //   decodeWalletConnectURI: true,
  // },
  // {
  //   name: "1inch Wallet",
  //   walletConnectId:
  //     "c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/52b1da3c-9e72-40ae-5dac-6142addd9c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "oneinch://",
  //   universalLink: "https://wallet.1inch.io/wc/",
  // },
  // {
  //   name: "SafeMoon",
  //   walletConnectId:
  //     "a0e04f1086aac204d4ebdd5f985c12ed226cd0006323fd8143715f9324da58d1",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/ea0140c7-787c-43a4-838f-d5ab6a342000?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "safemoon://",
  // },
  // {
  //   name: "Cypher Wallet",
  //   walletConnectId:
  //     "44ca80bba6838e116e8d0a2c1a1f37041ea322379cc65a71479b6a240b6fcab2",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/7bce0965-a4cc-4aad-6217-009d51017500?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "cypherwallet://",
  // },
  // {
  //   name: "PLTwallet",
  //   walletConnectId:
  //     "576c90ceaea34f29ff0104837cf2b2e23d201be43be1433feeb18d375430e1fd",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/a5d9dd15-8cef-42de-8bed-09e01a8b0200?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "pltwallet://",
  // },
  // {
  //   name: "Avacus",
  //   walletConnectId:
  //     "94f785c0c8fb8c4f38cd9cd704416430bcaa2137f27e1468782d624bcd155a43",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/a7106965-91cc-4a73-4688-c5c72ae0ed00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "avacus://",
  // },
  // {
  //   name: "Enjin Wallet",
  //   walletConnectId:
  //     "bdc9433ffdaee55d31737d83b931caa1f17e30666f5b8e03eea794bac960eb4a",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/add9626b-a5fa-4c12-178c-e5584e6dcd00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "enjinwallet://",
  // },
  // {
  //   name: "Slingshot Wallet",
  //   walletConnectId:
  //     "d23de318f0f56038c5edb730a083216ff0cce00c1514e619ab32231cc9ec484b",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/10c75467-6612-48ad-b97b-63985e922200?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "slingshot://",
  // },
  // {
  //   name: "Abra Wallet",
  //   walletConnectId:
  //     "c8c8f44329b9b826ded9a2ac330745f584a61aed6b1d0ed2a093b64bca7fc3bb",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/2219db01-e0c9-471c-5def-fd3b4e7a7a00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "abra://",
  // },
  // {
  //   name: "Blockchain.com",
  //   walletConnectId:
  //     "84b43e8ddfcd18e5fcb5d21e7277733f9cccef76f7d92c836d0e481db0c70c04",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/6f913b80-86c0-46f9-61ca-cc90a1805900?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "blockchain-wallet://",
  // },
  // {
  //   name: "KryptoGO Wallet",
  //   walletConnectId:
  //     "19418ecfd44963883e4d6abca1adeb2036f3b5ffb9bee0ec61f267a9641f878b",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/3ccbd966-97e8-45a0-1ceb-6141a8978e00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "kryptogo://",
  // },
  // {
  //   name: "AT.Wallet",
  //   walletConnectId:
  //     "aa01d13483db4c065b7a619b813f9eae1cb60c19bf0fc0ed3c36444a07257bd0",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/98bd3b9a-097e-4743-8808-986b4ad1ad00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "atwallet://",
  // },
  // {
  //   name: "PREMA Wallet",
  //   walletConnectId:
  //     "5b8e33346dfb2a532748c247876db8d596734da8977905a27b947ba1e2cf465b",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/6487869b-1165-4f30-aa3a-115665be8300?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "premawallet://",
  // },
  // {
  //   name: "ByteBank",
  //   walletConnectId:
  //     "7468ebbf5e14bd146c4fa12a08fb1a0d8d9af3b66409a5b682b64cffc4f21919",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/bc7aacd6-b2e2-4146-7d21-06e0c5d44f00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "hideoutWallet://",
  // },
  // {
  //   name: "Minerva Wallet",
  //   walletConnectId:
  //     "49bb9d698dbdf2c3d4627d66f99dd9fe90bba1eec84b143f56c64a51473c60bd",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/b57b2163-1bd8-4f6b-3311-470767e6d200?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "minerva://",
  // },
  // {
  //   name: "Copiosa",
  //   walletConnectId:
  //     "07f99a5d9849bb049d74830012b286f8b238e72b0337933ef22b84947409db80",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/cae1be94-9f53-4eba-b915-f6e381d5a500?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "copiosa://",
  // },
  // {
  //   name: "Bee Wallet",
  //   walletConnectId:
  //     "2cca8c1b0bea04ba37dee4017991d348cdb7b826804ab2bd31073254f345b715",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/f90bc33f-f085-40cf-7538-fae5ae84f900?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "beewallet.app://",
  // },
  // {
  //   name: "ABC Wallet",
  //   walletConnectId:
  //     "b956da9052132e3dabdcd78feb596d5194c99b7345d8c4bd7a47cabdcb69a25f",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/f9854c79-14ba-4987-42e1-4a82abbf5700?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "abc-wallet://abcwc",
  // },
];

let hasCheckedInstalled = false;
let installedWallets: typeof SUPPORTED_WALLETS = [];

export const getInstalledWallets = async (
  refresh: boolean
): Promise<InstalledWallet[]> => {
  if (hasCheckedInstalled && !refresh) return installedWallets;
  const checkInstalled = await Promise.all(
    SUPPORTED_WALLETS.map((w) => Linking.canOpenURL(w.customScheme))
  );
  installedWallets = SUPPORTED_WALLETS.filter((w, i) => checkInstalled[i]);
  hasCheckedInstalled = true;
  return installedWallets;
};
