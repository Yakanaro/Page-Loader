import nock from 'nock';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import pageData from '../src/pageload.js';

nock.disableNetConnect();

const link = 'https://hexlet.io/courses';

let distPath;
let expected;

beforeEach(async () => {
  distPath = await fs.mkdtemp(path.join(os.tmpdir(), 'loader-'));
});

beforeAll(async () => {
  expected = await fs.readFile(path.resolve('./__fixtures__', 'expected.html'), 'utf-8');
});

test('page-load', async () => {
  nock('https://hexlet.io').get('/courses').reply(200, expected);
  await pageData(link, distPath);
  const files = await fs.readdir(distPath);
  const resultFile = await fs.readFile(path.resolve(distPath, files[0]), 'utf-8');

  expect(resultFile).toEqual(expected);
});
