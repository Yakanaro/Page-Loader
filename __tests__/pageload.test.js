import nock from 'nock';
import { fileURLToPath } from 'url';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import httpAdapter from 'axios/lib/adapters/http';
import axios from 'axios';
import { test, beforeEach, beforeAll, expect } from '@jest/globals';
import pageData from '../src/pageload.js';

nock.disableNetConnect();
axios.defaults.adapter = httpAdapter;

const link = 'https://ru.hexlet.io/courses';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getFixturePath = (filename) => path.join(__dirname, '..', '__tests__/__fixtures__', filename);

let distPath;
let expected;
let beforeUpdate;
let afterUpdate;

beforeEach(async () => {
  distPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

beforeAll(async () => {
  expected = await fs.readFile(getFixturePath('expected.html'), 'utf-8');
  beforeUpdate = await fs.readFile(getFixturePath('beforeUpdate.html'), 'utf-8');
  afterUpdate = await fs.readFile(getFixturePath('afterUpdate.html'), 'utf-8');
});

test('page-load', async () => {
  nock('https://ru.hexlet.io').get('/courses').reply(200, expected);
  await pageData(link, distPath);
  const files = await fs.readdir(distPath);
  const resultFile = await fs.readFile(path.resolve(distPath, files[0]), 'utf-8');
  console.log(resultFile);
  console.log(expected);

  expect(resultFile).toEqual(expected);
});

test('download images', async () => {
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .reply(200, beforeUpdate)
    .get(/assets\/.*/i)
    .reply(200, { data: [1, 2] });

  await pageData(link, distPath);
  const files = await fs.readdir(distPath);
  const resultFile = await fs.readFile(path.resolve(distPath, files[0]), 'utf-8');
  const resultDir = await fs.readdir(path.resolve(distPath, files[1]), 'utf-8');
  expect(resultFile).toEqual(afterUpdate);
  expect(resultDir).toHaveLength(2);
});
