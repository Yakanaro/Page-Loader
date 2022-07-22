import nock from 'nock';
import debug from 'debug';
import { fileURLToPath } from 'url';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import pageLoader from '../src/pageload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const getFixturePath = (filename) => path.join(__dirname, '__fixtures__', filename);

let expected;
let distPath;
let image;

beforeEach(async () => {
  distPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expected = await fs.readFile(getFixturePath('expect.html'), 'utf-8');
  image = await fs.readFile(getFixturePath('img.svg'), 'utf-8');
});

test('HTML-page with resources', async () => {
  const scope = nock('https://ru.hexlet.io').get('/my').reply(200, expected).get('/img.svg').reply(200, image);
  await pageLoader('https://ru.hexlet.io/my', distPath);
  const page = await fs.lstat(path.join(distPath, 'ru-hexlet-io-my.html'));
  const resourcesFolder = await fs.lstat(path.join(distPath, 'ru-hexlet-io-my_files'));
  const downloadedImg = await fs.lstat(path.join(distPath, 'ru-hexlet-io-my_files', 'ru-hexlet-io-img.svg'));

  expect(scope.isDone()).toBe(true);
  expect(page.isFile()).toBe(true);
  expect(resourcesFolder.isDirectory()).toBe(true);
  expect(downloadedImg.isFile()).toBe(true);
});

test('Should generate 404 error', async () => {
  nock('https://abc.xyz').get('/a').reply(404);
  await expect(pageLoader('https://abc.xyz/a', distPath)).rejects.toThrow('Request failed with status code 404');
});

test('Should generate ENOENT error', async () => {
  nock('https://example.com/').get('/a').reply(200, '<html></html');
  await expect(pageLoader('https://example.com/a', path.join(distPath, 'any'))).rejects.toThrow('ENOENT');
});
