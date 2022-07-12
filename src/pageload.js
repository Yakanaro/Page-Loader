import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import generateFileName from '../src/build-name.js';

// const dirName = '/Users/sergej/backend-project-lvl3/src';

const getFolderName = (link, baseURL) => {
  const url = new URL(link, baseURL);
  const folderName = `${url.hostname}${url.pathname}`.replace(/[./]/g, '-');
  return folderName;
};

// const generateFolderName = (link = 'https://ru.hexlet.io/courses') => {
//   const { hostname, pathname } = new URL(link);
//   const raw = `${hostname}${pathname}`;
//   const target = raw
//     .replace(/[^a-zA-Z0-9]/g, ' ')
//     .trim()
//     .replace(/\s/g, '-');
//   console.log(`${target}_files`);
// };

// const pageData = (url, outpitDir) =>
//   axios.get(url).then((content) => {
//     const srcDirPath = path.join(outpitDir, `${getFolderName(url)}_files`);
//     const fileName = generateFileName(url);
//     // const dirName = `${outpitDir}/${fileName}.html`;
//     console.log(path.join(srcDirPath, fileName));
//     return fs.writeFile(path.join(srcDirPath, fileName), content.data);
//   });

// export default pageData;

const pageData = (url, outputDir) => {
  const srcDirPath = path.join(outputDir);
  const fileName = generateFileName(url);
  const getData = axios.get(url).then((content) => {
    console.log(path.join(srcDirPath, fileName));
    return fs.writeFile(path.join(srcDirPath, fileName), content.data);
  });
  return getData;
};

export default pageData;
