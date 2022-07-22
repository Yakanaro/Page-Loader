import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import axiosDebug from 'axios-debug-log';
import Listr from 'listr';
import url from 'url';

axiosDebug({
  request(deb, config) {
    deb(`Request with ${config.headers['content-type']}`);
  },
  response(deb, response) {
    deb(`Response with ${response.headers['content-type']}`, `from ${response.config.url}`);
  },
});

const log = debug('page-loader');

const tags = {
  script: 'src',
  img: 'src',
  link: 'href',
};

export const createFileName = (url) => {
  const parts = url
    .replace('https://', '')
    .replace(/[\W]{1}$/g, '')
    .replace(/[\W]/g, '-');
  return parts;
};

export const checkLocalLink = (link, url) => {
  const originalHost = new URL(url).origin;
  return new URL(link, originalHost).origin === originalHost;
};

export const getFilesDirectoryPath = (url) => `${createFileName(url)}_files`;

export const getFilename = (resUrl, baseUrl) => {
  const { pathname } = new URL(resUrl, 'https://example.com');
  const filename = pathname
    .split('/')
    .filter((el) => el !== '')
    .join('-');
  return filename === '' ? 'index.html' : `${createFileName(baseUrl)}-${filename}`;
};

const buildName = (link) => {
  const { pathname, host } = new URL(link);
  const fileName = `${host}${pathname}`
    .split(/[^\w+]/gi)
    .filter((el) => el !== '')
    .join('-');
  return fileName;
};

const buildAssetName = (rootAddress, link) => {
  const newUrl = createFileName(rootAddress);
  const { dir, name, ext } = path.parse(link);
  const assetNameWithExtName = `${newUrl}-${name}`.concat(ext || '.html');
  return assetNameWithExtName;
};

export const downloadHtml = (url, htmlPath) => axios.get(url).then((response) => fs.writeFile(htmlPath, response.data, 'utf-8'));

export const getLinksAndChangeHtml = (html, url) => {
  log('parsing html for local links and transforming HTML-page');
  const links = [];
  const $ = cheerio.load(html);
  Object.keys(tags).map((tag) =>
    $(tag).each((i, el) => {
      const link = $(el).attr(tags[tag]);
      if (link && checkLocalLink(link, url)) {
        $(el).attr(`${tags[tag]}`, `${path.join(getFilesDirectoryPath(url), buildAssetName(url, link))}`);
        links.push(link);
      }
    })
  );
  return { links, newHtml: $.html() };
};

export const getAbsoluteUrls = (links, url) => {
  return links.map((link) => new URL(link, url).href);
};

export const downloadResources = (links, resourcesPath, url) => {
  log('downloading resources');
  return fs.mkdir(resourcesPath).then(() => {
    const promises = links.map((link) => {
      return {
        title: `Downloading ${link}`,
        task: () =>
          axios({
            method: 'get',
            url: link,
            responseType: 'arraybuffer',
          }).then((data) => {
            console.log(path.join(resourcesPath, buildAssetName(url, link)));
            return fs.writeFile(path.join(resourcesPath, buildAssetName(url, link)), data.data);
          }),
      };
    });
    return new Listr(promises, { concurrent: true, exitOnError: false }).run().catch((error) => ({ result: 'error', error }));
  });
};
