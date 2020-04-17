import { createTestLogger } from "@jupiterone/jupiter-managed-integration-sdk";
import { Polly } from "@pollyjs/core";

import polly from "../../../test/helpers/polly";
import config from "../../../test/integrationInstanceConfig";
import { StorageClient } from "./client";
import {
  BlobContainer,
  StorageAccount,
  FileShare,
} from "@azure/arm-storage/esm/models";

let p: Polly;

afterEach(async () => {
  await p.stop();
});

describe("iterateStorageAccounts", () => {
  test("all", async () => {
    p = polly(__dirname, "iterateStorageAccounts");

    const client = new StorageClient(config, createTestLogger());

    const sa: StorageAccount[] = [];
    await client.iterateStorageAccounts((e) => {
      sa.push(e);
    });

    expect(sa).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        name: "j1dev",
        kind: "StorageV2",
        tags: expect.objectContaining({
          environment: "j1dev",
        }),
      }),
      expect.objectContaining({
        id: expect.any(String),
        name: "j1devblobstorage",
        kind: "BlobStorage",
        enableHttpsTrafficOnly: true,
        tags: expect.objectContaining({
          environment: "j1dev",
        }),
      }),
    ]);
  });
});

describe("iterateStorageBlobContainers", () => {
  test("all", async () => {
    p = polly(__dirname, "iterateStorageBlobContainers");

    const client = new StorageClient(config, createTestLogger());

    const containers: BlobContainer[] = [];
    await client.iterateStorageBlobContainers(
      {
        id:
          "/subscriptions/dccea45f-7035-4a17-8731-1fd46aaa74a0/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/j1dev",
        name: "j1dev",
      } as StorageAccount,
      (e) => {
        containers.push(e);
      },
    );

    expect(containers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(
            /Microsoft\.Storage\/storageAccounts\/j1dev\/blobServices\/default\/containers\/bootdiagnostics-j1dev-/,
          ),
          name: expect.stringMatching(/bootdiagnostics-j1dev-/),
        }),
        expect.objectContaining({
          id:
            "/subscriptions/dccea45f-7035-4a17-8731-1fd46aaa74a0/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/j1dev/blobServices/default/containers/j1dev",
          name: "j1dev",
        }),
      ]),
    );
  });

  // skipped because jest.useFakeTimers() wouldn't work
  test.skip(
    "retry",
    async () => {
      // jest.useFakeTimers();

      p = polly(__dirname, "iterateStorageBlobContainersRetry", {
        recordFailedRequests: true,
      });

      const client = new StorageClient(config, createTestLogger());

      let containers: BlobContainer[] = [];

      // Get past the 100/5 min limit, be sure we get more than 100 just over 5 minutes
      for (let index = 0; index < 103; index++) {
        containers = [];
        await client.iterateStorageBlobContainers(
          {
            id:
              "/subscriptions/dccea45f-7035-4a17-8731-1fd46aaa74a0/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/j1dev",
            name: "j1dev",
          } as StorageAccount,
          (e) => {
            containers.push(e);
          },
        );
      }

      expect(containers).toEqual([
        expect.objectContaining({
          type: "Microsoft.Storage/storageAccounts/blobServices/containers",
        }),
        expect.objectContaining({
          type: "Microsoft.Storage/storageAccounts/blobServices/containers",
        }),
      ]);
    },
    1000 * 1000, // allow this test to run long enough to hit the limit
  );
});

describe("iterateFileShares", () => {
  test("all", async () => {
    p = polly(__dirname, "iterateFileShares");

    const client = new StorageClient(config, createTestLogger());

    const resources: FileShare[] = [];
    await client.iterateFileShares(
      {
        id:
          "/subscriptions/dccea45f-7035-4a17-8731-1fd46aaa74a0/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/j1dev",
        name: "j1dev",
      } as StorageAccount,
      (e) => {
        resources.push(e);
      },
    );

    expect(resources).toEqual([
      expect.objectContaining({
        id:
          "/subscriptions/dccea45f-7035-4a17-8731-1fd46aaa74a0/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/j1dev/fileServices/default/shares/j1dev",
        name: "j1dev",
        shareQuota: 1,
      }),
    ]);
  });
});
