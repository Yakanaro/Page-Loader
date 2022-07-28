import { promises as fs } from 'fs';
import path from 'path';
import {
  downloadHtml, getAbsoluteUrls, downloadResources, buildName, getLinks, changeHtml
} from './utilites.js';

// const pageLoader = (url, destinationFolder = process.cwd()) => {
//   const htmlPath = `${path.join(destinationFolder, buildName(url))}.html`;
//   const resourcesPath = `${path.join(destinationFolder, buildName(url))}_files`;
//   return downloadHtml(url, htmlPath)
//     .then(() => fs.readFile(htmlPath, 'utf-8'))
//     .then((html) => getLinksAndChangeHtml(html, url))
//     .then(({ links, newHtml }) => fs.writeFile(htmlPath, newHtml).then(() => links))
//     .then((links) => getAbsoluteUrls(links, url))
//     .then((urls) => downloadResources(urls, resourcesPath, url));
// };
// export default pageLoader;

const pageLoader = (url, destinationFolder = process.cwd()) => {
  const htmlPath = `${path.join(destinationFolder, buildName(url))}.html`;
  const resourcesPath = `${path.join(destinationFolder, buildName(url))}_files`;
  let savedHtml;
  return downloadHtml(url, htmlPath)
    .then(() => fs.readFile(htmlPath, 'utf-8'))
    .then((html) => {
      savedHtml = html;
      const changedHtml = changeHtml(html, url);
      return fs.writeFile(htmlPath, changedHtml);
    })
    .then(() => {
      const links = getLinks(savedHtml, url);
      return getAbsoluteUrls(links, url);
    })
    .then((urls) => downloadResources(urls, resourcesPath, url));
};
export default pageLoader;
