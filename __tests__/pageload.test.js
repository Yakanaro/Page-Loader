import nock from 'nock';
import { fileURLToPath } from 'url';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import httpAdapter from 'axios/lib/adapters/http';
import axios from 'axios';
import pageLoader from '../src/pageload.js';

axios.defaults.adapter = httpAdapter;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getFixturePath = (filename) => `${__dirname}/__fixtures__/${filename}`;

nock.disableNetConnect();

const link = 'https://hexlet.io/courses';
const link2 = 'https://ru.hexlet.io/courses';

let expected;
let distPath;
let nockBody;

beforeEach(async () => {
  distPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  nockBody = await fs.readFile(getFixturePath('hexlet-io-courses.html'), 'utf-8');
  expected = await fs.readFile(getFixturePath('expected.html'), 'utf-8');
});
beforeAll(async () => {
  expected = await fs.readFile(getFixturePath('hexlet-io-courses.html'), 'utf-8');
});

test('page-load', async () => {
  nock('https://ru.hexlet.io').get('/courses').reply(200, expected);
  await pageLoader(link2, distPath);
  const files = await fs.readdir(distPath);
  const resultFile = await fs.readFile(path.resolve(distPath, files[0]), 'utf-8');

  expect(resultFile).toEqual(expected);
});

test('Successful page loading', async () => {
  nock('https://hexlet.io').get('/courses').reply(200, nockBody);
  nock('https://hexlet.io').get('/courses/file1.css').reply(200, 'Response from google');
  nock('https://hexlet.io').get('/courses/file2.js').reply(200, 'Response from ebay');

  await pageLoader(link, distPath);

  const htmlBeforeSavingResources = await fs.readFile(getFixturePath('hexlet-io-courses.html'));
  const pageHtmlPath = path.join(distPath, 'hexlet-io-courses.html');
  const loadedHtmlData = await fs.readFile(pageHtmlPath);

  const sourceDirPath = path.join(distPath, 'hexlet-io-courses_files');
  const sources = await fs.readdir(sourceDirPath);

  expect(loadedHtmlData).toBeTruthy();
  expect(loadedHtmlData).not.toBe(htmlBeforeSavingResources);

  expect(sources.length).toBe(2);
  expect(sources.includes('file1.css')).toBeTruthy();
  expect(sources.includes('file2.js')).toBeTruthy();
});
