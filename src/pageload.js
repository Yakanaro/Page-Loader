import { promises as fs } from 'fs';
import path from 'path';
import {
  createFileName,
  getFilesDirectoryPath,
  downloadHtml,
  getLinksAndChangeHtml,
  getAbsoluteUrls,
  downloadResources,
  buildName,
} from './utilites.js';

const pageLoader = (url, destinationFolder = process.cwd()) => {
  console.log(`${path.join(destinationFolder, buildName(url))}.html`);
  // const htmlPath = `${path.join(destinationFolder, createFileName(url))}.html`;
  const htmlPath = `${path.join(destinationFolder, buildName(url))}.html`;
  const resourcesPath = path.join(destinationFolder, getFilesDirectoryPath(url));
  return downloadHtml(url, htmlPath)
    .then(() => fs.readFile(htmlPath, 'utf-8'))
    .then((html) => getLinksAndChangeHtml(html, url))
    .then(({ links, newHtml }) => fs.writeFile(htmlPath, newHtml).then(() => links))
    .then((links) => getAbsoluteUrls(links, url))
    .then((urls) => downloadResources(urls, resourcesPath, url));
};
export default pageLoader;
