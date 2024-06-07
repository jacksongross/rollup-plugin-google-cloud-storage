import fs from "node:fs";

import { Storage } from "@google-cloud/storage";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rollup } from "rollup";

import RollupPluginGoogleCloudStorage from "../index";

const mockedBucket = {
  upload: vi.fn((file) => Promise.resolve(file)),
};

const mockedStorage = {
  bucket: vi.fn(() => mockedBucket),
};

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

vi.mock("@google-cloud/storage", () => ({
  Storage: vi.fn(() => mockedStorage),
}));

async function buildRollupBundle(options) {
  const bundle = await rollup({
    input: "./test/fixtures/main.js",
    logLevel: "silent",
    plugins: [RollupPluginGoogleCloudStorage(options)],
  });

  return bundle.write({ dir: "./dist" });
}

describe("RollupPluginGoogleCloudStorage", () => {
  afterEach(() => {
    fs.rmSync("dist", { recursive: true, force: true });
  });

  describe("writeBundle", () => {
    describe("when no options are provided", () => {
      it("throws a validation error", async () => {
        expect(async () => buildRollupBundle()).rejects.toThrowError(
          /Required/
        );
      });
    });

    describe("when directory is not found", () => {
      it("throws an error", async () => {
        const options = {
          bucketName: "my-bucket",
          directory: "does-not-exist",
          serviceKeyJson: JSON.stringify({ some: "key" }),
        };

        expect(async () => buildRollupBundle(options)).rejects.toThrowError();
      });
    });

    it("uploads files to Google Storage bucket for provided options", async () => {
      const options = {
        bucketName: "my-bucket",
        directory: "./test/fixtures",
        serviceKeyJson: JSON.stringify({ some: "key" }),
      };

      await buildRollupBundle(options);

      expect(Storage).toHaveBeenCalledWith({
        credentials: JSON.parse(options.serviceKeyJson),
      });
      expect(mockedStorage.bucket).toHaveBeenCalledWith(options.bucketName);
      expect(mockedBucket.upload).toHaveBeenCalledWith(
        "./test/fixtures/main.js",
        expect.any(Object)
      );
    });
  });
});
