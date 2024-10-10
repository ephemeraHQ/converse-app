// // import AsyncStorage from "@react-native-async-storage/async-storage";
//
// import { StorageEntity, storageSchema } from "@/storage/storage.types";
// import { getDefaultEntityValue } from "@/storage/storage.defaultValues";
//
// export class StorageClient {
//   save: (key: string, value: any) => Promise<void>;
//   read: (key: string) => Promise<string>;
//
//   constructor(
//     save: (key: string, value: any) => Promise<void>,
//     read: (key: string) => Promise<string>,
//   ) {
//     this.save = save;
//     this.read = read;
//   }
//
//   static live(): StorageClient {
//     const AsyncStorage =
//       require("@react-native-async-storage/async-storage").default;
//
//     const save = (key: string, value: any) => {
//       return AsyncStorage.setItem(key, JSON.stringify(value));
//     };
//
//     const read = (key: string) => {
//       return AsyncStorage.getItem(key);
//     };
//
//     return new StorageClient(save, read);
//   }
//
//   static inMemory(): StorageClient {
//     const inMemoryStore: Record<string, string> = {};
//     const inMemorySave = (key: string, value: any) => {
//       inMemoryStore[key] = JSON.stringify(value);
//       return Promise.resolve();
//     };
//     const inMemoryRead = async (key: string): Promise<string> => {
//       const anyValue = inMemoryStore[key];
//       return anyValue;
//     };
//     for (const key in storageSchema) {
//       inMemoryStore[key] = JSON.stringify(
//         getDefaultEntityValue(key as StorageEntity),
//       );
//     }
//     return new StorageClient(inMemorySave, inMemoryRead);
//   }
//
//   // static reviewAndRatingsEnabled(): StorageClient {
//   //   const
//   //   // return StorageClient.mock((featureFlag) => featureFlag === 'reviewAndRatingsEnabled');
//   // }
//
//   /**
//    * Creates a StorageClient that throws an error when used.
//    * This is useful for ensuring that tests explicitly provide implementations,
//    * preventing unintended or uncontrolled use of dependencies in tests.
//    */
//   static unimplemented(): StorageClient {
//     const readWithThrowsError = (key: string) => {
//       throw new Error(
//         `
// [StorageClient] ERROR: unimplemented - Your code has invoked StorageClient:read
// with key '${key}'
// without specifying an implementation. This unimplemented dependency is here to
// ensure you don't invoke code you don't intend to, ensuring your tests are truly
// testing what they are expected to
//           `,
//       );
//     };
//
//     const saveWithThrowsError = (key: string, value: any) => {
//       throw new Error(
//         "[StorageClient] ERROR: unimplemented - Your code has invoked StorageClient:save " +
//           "without specifying an implementation. This unimplemented dependency is here to " +
//           "ensure you don't invoke code you don't intend to, ensuring your tests are truly " +
//           "testing what they are expected to",
//       );
//     };
//
//     return new StorageClient(saveWithThrowsError, readWithThrowsError);
//   }
// }
