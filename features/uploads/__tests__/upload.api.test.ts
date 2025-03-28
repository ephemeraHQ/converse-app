test.todo("test upload file")
// import { describe, expect, test, jest, beforeAll } from "@jest/globals";
// import type { AxiosRequestConfig } from "axios";
// import {
//   getPresignedUploadUrl,
//   uploadFileWithPresignedUrl,
//   uploadFile,
// } from "../upload.api";

// // Mock native modules but keep real API calls
// jest.mock("expo-crypto", () => ({
//   getRandomBytesAsync: () => Promise.resolve(new Uint8Array(32)),
// }));

// jest.mock("expo-secure-store", () => ({
//   AFTER_FIRST_UNLOCK: "AFTER_FIRST_UNLOCK",
// }));

// const API_BASE_URL = "http://localhost:4000";

// jest.mock("@/config", () => ({
//   config: {
//     bundleId: "com.convos.dev",
//     apiUrl: API_BASE_URL,
//   },
// }));

// // Mock authentication headers
// jest.mock("@/features/authentication/authentication.headers", () => ({
//   getAuthenticationHeaders: () =>
//     Promise.resolve({
//       "x-device-id": "test-device-id",
//       "x-device-secret": "test-device-secret",
//     }),
// }));

// jest.mock("@/utils/api/api", () => {
//   const axios = require("axios");
//   const instance = axios.create({
//     baseURL: API_BASE_URL,
//   });

//   // Add authentication headers to all requests
//   instance.interceptors.request.use(async (config: AxiosRequestConfig) => {
//     config.headers = {
//       ...config.headers,
//       "x-device-id": "test-device-id",
//       "x-device-secret": "test-device-secret",
//     };
//     return config;
//   });

//   return {
//     api: instance,
//   };
// });

// /**
//  * Integration tests that perform live operations with the upload API and S3.
//  * These tests require:
//  * 1. A running backend server
//  * 2. Valid S3 credentials in the backend
//  */
// describe("upload.api.ts integration tests", () => {
//   test("should get presigned URL for text file", async () => {
//     const contentType = "text/plain";
//     const response = await getPresignedUploadUrl(contentType);

//     expect(response.url).toBeDefined();
//     expect(response.url).toMatch(/^https:\/\//);
//     expect(response.objectKey).toBeDefined();
//   });

//   test("should upload text file using presigned URL", async () => {
//     // Get presigned URL
//     const contentType = "text/plain";
//     const { url, objectKey } = await getPresignedUploadUrl(contentType);

//     // Create test content
//     const testContent = "Hello, this is a test file!";
//     const blob = new Blob([testContent], { type: contentType });

//     // Upload using presigned URL
//     const publicUrl = await uploadFileWithPresignedUrl(url, blob, contentType);

//     expect(publicUrl).toBeDefined();
//     expect(publicUrl).toMatch(/^https:\/\//);

//     // Verify uploaded content
//     const downloadResponse = await fetch(publicUrl);
//     expect(downloadResponse.status).toBe(200);
//     const downloadedContent = await downloadResponse.text();
//     expect(downloadedContent).toBe(testContent);
//   });

//   test("should upload image file using convenience function", async () => {
//     // Create a test image (1x1 pixel PNG)
//     const pngImageBytes = new Uint8Array([
//       0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
//       0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
//       0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
//       0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60, 0x60, 0x60, 0x60,
//       0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
//       0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
//     ]);

//     // Create File object (since uploadFile expects a File)
//     const file = new File([pngImageBytes], "test.png", { type: "image/png" });

//     // Upload using convenience function
//     const { publicUrl, objectKey } = await uploadFile(file);

//     expect(publicUrl).toBeDefined();
//     expect(publicUrl).toMatch(/^https:\/\//);
//     expect(objectKey).toBeDefined();

//     // Verify uploaded content
//     const downloadResponse = await fetch(publicUrl);
//     expect(downloadResponse.status).toBe(200);
//     const downloadedBuffer = await downloadResponse.arrayBuffer();
//     const downloadedBytes = new Uint8Array(downloadedBuffer);
//     expect(downloadedBytes).toEqual(pngImageBytes);
//   });

//   test("should handle various content types", async () => {
//     const contentTypes = [
//       "image/jpeg",
//       "image/png",
//       "application/pdf",
//       "text/plain",
//       "application/json",
//     ];

//     for (const contentType of contentTypes) {
//       const response = await getPresignedUploadUrl(contentType);
//       expect(response.url).toBeDefined();
//       expect(response.url).toMatch(/^https:\/\//);
//       expect(response.objectKey).toBeDefined();

//       // Verify content type is included in URL
//       const urlParams = new URLSearchParams(new URL(response.url).search);
//       expect(
//         urlParams.get("Content-Type") || urlParams.get("content-type")
//       ).toBe(contentType);
//     }
//   });
// });
