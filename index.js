import { readdir } from "node:fs/promises";

import { Storage } from "@google-cloud/storage";
import ora from 'ora';
import pLimit from 'p-limit';
import { z } from "zod";

async function getFilenamesForDirectory(directory) {
  const files = await readdir(directory, { recursive: true, withFileTypes: true });

  return files
        .filter((dirent) => dirent.isFile())
        .map((file) => `${file.parentPath}/${file.name}`)
}

async function uploadToBucketFromDirectory(spinner, options) {
  const {
    serviceKeyJson,
    bucketName,
    concurrency,
    directory,
    skipIfExists,
  } = options;

  const limit = pLimit(concurrency);

  let credentials = serviceKeyJson;

  if (typeof credentials === 'string') {
    credentials = JSON.parse(credentials);
  }

  const storage = new Storage({ credentials });

  function uploadFile(filePath) {
    return storage.bucket(bucketName).upload(filePath, {
      destination: filePath.replace(directory, ''),
      ...skipIfExists ? {
        preconditionOpts: {
          ifGenerationMatch: 0
        }
      }: {},
    });
  }

  let uploaded = 0;
  let skipped = 0;

  const files = await getFilenamesForDirectory(directory);

  const promises = files.map(file => (
    limit(() => (
      uploadFile(file)
        .then(() => {
          uploaded += 1;
          spinner.text = `uploaded ${file}`;
        })
        .catch(() => {
          skipped += 1;
          spinner.text = `skipped ${file}`;
        })
      ))
  ));

  await Promise.all(promises);

  return { uploaded, skipped };
}

export default function googleCloudStorageSync(options) {
  const Options = z.object({
    directory: z.string().default('dist'),
    bucketName: z.string(),
    serviceKeyJson: z.union([z.string(), z.object()]),
    concurrency: z.number().default(5),
    skipIfExists: z.boolean().default(true),
  });

  return {
    name: "google-cloud-storage",
    writeBundle: async () => {
      const parsedOptions = Options.parse(options);

      const spinner = ora(`Uploading files from ${parsedOptions.directory} to ${parsedOptions.bucketName}`).start();

      try {
        const { uploaded, skipped } = await uploadToBucketFromDirectory(spinner, parsedOptions);
        spinner.succeed(`${uploaded} files uploaded, ${skipped} skipped`);
      } catch (error) {
        spinner.fail("Something went wrong uploading the files to Google Cloud Storage");
        throw error;
      }
    },
  };
}
