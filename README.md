# rollup-plugin-google-cloud-storage
A plugin to sync built assets to a Google Cloud Storage bucket.

![Version](https://img.shields.io/npm/v/rollup-plugin-google-cloud-storage) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#) [![GitHub issues](https://img.shields.io/github/issues/jacksongross/rollup-plugin-google-cloud-storage)](https://github.com/jacksongross/rollup-plugin-google-cloud-storage/issues)

## Installation

Install the plugin with npm

```bash
npm install rollup-plugin-google-cloud-storage --save-dev
```
## Basic example
An example rollup.config.js:

```js
import GoogleCloudStorage from 'rollup-plugin-google-cloud-storage';

const options {
  directory: "some-directory" // directory to upload from, default `"dist"`
  bucketName: "my-bucket", // name of bucket in GCP, required
  serviceKeyJson: "{...}", // JSON string of service account key, required
  concurrency: 1, // number of files to upload at a time, default `5`
  skipIfExists: false // skips uploading file if already present in the destination bucket, default `true`
};

export default {
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [GoogleCloudStorage(options)]
};
```


