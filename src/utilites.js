import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import axiosDebug from 'axios-debug-log';
import Listr from 'listr';

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

export const buildName = (link) => {
  const { pathname, host } = new URL(link);
  const fileName = `${host}${pathname}`
    .split(/[^\w+]/gi)
    .filter((el) => el !== '')
    .join('-');
  return fileName;
};

export const checkLocalLink = (link, url) => {
  const originalHost = new URL(url).origin;
  return new URL(link, originalHost).origin === originalHost;
};

export const getFilesDirectoryPath = (url) => `${buildName(url)}_files`;

const buildAssetName = (rootAddress, link) => {
  const { dir, name, ext } = path.parse(link);
  const assetNameWithoutExtName = buildName(new URL(`${dir}/${name}`, rootAddress));
  const assetNameWithExtName = assetNameWithoutExtName.concat(ext || '.html');
  return assetNameWithExtName;
};

export const downloadHtml = (url, htmlPath) => axios.get(url).then((response) => fs.writeFile(htmlPath, response.data, 'utf-8'));

export const getLinks = (html, url) => {
  log('parsing html for local links');
  const links = [];
  const $ = cheerio.load(html);
  Object.keys(tags).forEach((tag) => $(tag).each((i, el) => {
    const link = $(el).attr(tags[tag]);
    if (link && checkLocalLink(link, url)) {
      $(el).attr(`${tags[tag]}`, `${path.join(getFilesDirectoryPath(url), buildAssetName(url, link))}`);
      links.push(link);
    }
  }));
  return links;
};

export const changeHtml = (html, url) => {
  log('transforming HTML-page');
  const $ = cheerio.load(html);
  Object.keys(tags).forEach((tag) => $(tag).each((i, el) => {
    const link = $(el).attr(tags[tag]);
    if (link && checkLocalLink(link, url)) {
      $(el).attr(`${tags[tag]}`, `${path.join(getFilesDirectoryPath(url), buildAssetName(url, link))}`);
    }
  }));
  return $.html();
};

export const getAbsoluteUrls = (links, url) => links.map((link) => new URL(link, url).href);

export const downloadResources = (links, resourcesPath, url) => {
  log('downloading resources');
  return fs.mkdir(resourcesPath).then(() => {
    const promises = links.map((link) => ({
      title: `Downloading ${link}`,
      task: () => axios({
        method: 'get',
        url: link,
        responseType: 'arraybuffer',
      // eslint-disable-next-line max-len
      }).then((data) => fs.writeFile(path.join(resourcesPath, buildAssetName(url, link)), data.data)),
    }));
    return new Listr(promises, { concurrent: true, exitOnError: false }).run().catch((error) => ({ result: 'error', error }));
  });
};
