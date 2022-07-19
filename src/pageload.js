import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import prettier from 'prettier';
import os from 'os';
import * as url from 'url';

// const getStringNameFromURL = (url, ending) => {
//   const { hostname, pathname } = new URL(url);
//   const { dir, name } = path.parse(pathname);
//   const urlString = `${hostname}${dir}/${name}`;
//   const regex = /\W/gm;
//   const outputName = urlString.replace(regex, '-').concat(ending);
//   return outputName;
// };

// const parse = (data) => {
//   const mapping = {
//     img: 'src',
//     script: 'src',
//     link: 'href',
//   };
//   const $ = cheerio.load(data);
//   const links = [];
//   $(Object.keys(mapping)).each((i, tagName) => {
//     links.push(
//       $('html')
//         .find(tagName)
//         .map((j, el) => $(el).attr(mapping[tagName]))
//         .get()
//     );
//   });
//   return links.flat();
// };

// const pageData = (url, outputDir) => {
//   const fileName = getStringNameFromURL(url, '.html');
//   const dirName = getStringNameFromURL(url, '_files');
//   let html;
//   let links;
//   let images;

//   return axios
//     .get(url)
//     .then((res) => {
//       html = res.data;
//       links = parse(html);
//       return html;
//     })
//     .then((data) => fs.appendFile(path.resolve(outputDir, fileName), data))
//     .then(() => fs.mkdir(path.resolve(outputDir, dirName)))
//     .then(() => downloadImages(links, url))
//     .then((imgPath) =>
//       Promise.all(
//         imgPath.map((image) => {
//           const imagePath = getStringNameFromURL(image.config.url, path.extname(image.config.url));
//           return fs.appendFile(path.resolve(outputDir, dirName, imagePath), image.data);
//         })
//       )
//     )
//     .then(() => fs.readdir(path.resolve(outputDir, dirName)))
//     .then((imageData) => {
//       images = imageData.map((pathImage) => `${dirName}/${pathImage}`);
//     })
//     .then(() => {
//       const htmlUpdate = updateHTML(html, images);
//       html = prettier.format(htmlUpdate, { parser: 'html' });
//       return fs.writeFile(path.resolve(outputDir, fileName), html);
//     });
// };

// const downloadImages = (links, url) => {
//   const promises = links.map((link) => {
//     console.log(link);
//     if (link.startsWith('https:')) {
//       const config = axios({
//         method: 'get',
//         url: `${link}`,
//         responseType: 'stream',
//       });
//       return config;
//     } else {
//       const config = axios({
//         method: 'get',
//         url: `${url}${link}`,
//         responseType: 'stream',
//       });
//       return config;
//     }
//   });
//   return Promise.all(promises).catch((err) => console.error(err));
// };

// const updateHTML = (html, data) => {
//   const $ = cheerio.load(html);
//   $('html')
//     .find('img')
//     .map(function (index) {
//       return $(this).attr('src', data[index]);
//     });
//   return $.html();
// };

// export default pageData;

const getFileName = (link, baseUrl) => {
  const url = new URL(link, baseUrl);
  const { dir, name, ext } = path.parse(url.pathname.slice(1));
  const fileName = path.join(dir, name);
  const normalizedName = fileName.replace(/[./]/g, '-');
  return `${normalizedName}${ext}`;
};

const getFolderName = (link, baseURL) => {
  const url = new URL(link, baseURL);
  const folderName = `${url.hostname}${url.pathname}`.replace(/[./]/g, '-');
  return folderName;
};

const mapping = {
  script: 'src',
  link: 'href',
  img: 'src',
};

const checkIfRelativeUrl = (link) => {
  const host = 'https://localhost';
  const baseUrl = new URL(host);
  const srcUrl = new URL(link, host);
  const isRelativeUrl = srcUrl.hostname === baseUrl.hostname;
  return isRelativeUrl;
};

const getLink = (tags) => {
  const links = tags.map((tag) => tag.attribs[mapping[tag.name]]);
  return links;
};

const getTagsWithLocalLinks = (html) => {
  const $ = cheerio.load(html);
  const tags = [];
  Object.keys(mapping).forEach((tagName) => tags.push(...$(tagName).get()));
  const tagsWithLocalLinks = tags.filter((tag) => checkIfRelativeUrl(tag.attribs[mapping[tag.name]]));
  return tagsWithLocalLinks;
};

const getLinks = (html) => {
  const tags = getTagsWithLocalLinks(html);
  const links = getLink(tags);

  return links;
};

const updateHTML = (html, distPath, pageUrl) => {
  const $ = cheerio.load(html);
  const tags = getLinks(html);
  tags.forEach((i, tag) => {
    const { name } = tag;
    const attribut = mapping[name];
    const link = $(name).attr(attribut);
    const localPath = path.join(distPath, getFileName(link, pageUrl));
    $(name).attr(attribut, localPath);
  });
  return $.html();
};

const pageLoader = (pageUrl, dirpath) => {
  const pageFilePath = path.join(dirpath, `${getFolderName(pageUrl)}.html`);
  const srcDirPath = path.join(dirpath, `${getFolderName(pageUrl)}_files`);
  let data;
  const pageData = axios
    .get(pageUrl)
    .then((response) => {
      data = response.data;
      return data;
    })
    .then(() => fs.mkdir(srcDirPath))
    .then(() => {
      const links = getLinks(data);
      const tasks = links.map((link) =>
        axios({
          method: 'get',
          url: link,
          baseURL: pageUrl,
          responseType: 'arraybuffer',
        }).then((response) => {
          const fileName = getFileName(link, pageUrl);
          return fs.writeFile(path.join(srcDirPath, fileName), response.data);
        })
      );
    })
    .then(() => {
      const updatedHtml = updateHTML(data, srcDirPath, pageUrl);
      return fs.writeFile(pageFilePath, updatedHtml);
    });
  return pageData;
};
export default pageLoader;
