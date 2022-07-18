import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import prettier from 'prettier';

const getStringNameFromURL = (url, ending) => {
  const { hostname, pathname } = new URL(url);
  const { dir, name } = path.parse(pathname);
  const urlString = `${hostname}${dir}/${name}`;
  const regex = /\W/gm;
  const outputName = urlString.replace(regex, '-').concat(ending);
  return outputName;
};

const parse = (data) => {
  const mapping = {
    img: 'src',
  };
  const $ = cheerio.load(data);
  const links = [];
  $(Object.keys(mapping)).each((i, tagName) => {
    links.push(
      $('html')
        .find(tagName)
        .map((j, el) => $(el).attr(mapping[tagName]))
        .get()
    );
  });
  return links.flat();
};

const pageData = (url, outputDir) => {
  const fileName = getStringNameFromURL(url, '.html');
  const dirName = getStringNameFromURL(url, '_files');
  let html;
  let links;
  let images;

  return axios
    .get(url)
    .then((res) => {
      html = res.data;
      links = parse(html);
      return html;
    })
    .then((data) => fs.appendFile(path.resolve(outputDir, fileName), data))
    .then(() => fs.mkdir(path.resolve(outputDir, dirName)))
    .then(() => downloadImages(links, url))
    .then((imgPath) =>
      Promise.all(
        imgPath.map((image) => {
          const imagePath = getStringNameFromURL(image.config.url, path.extname(image.config.url));
          return fs.appendFile(path.resolve(outputDir, dirName, imagePath), image.data);
        })
      )
    )
    .then(() => fs.readdir(path.resolve(outputDir, dirName)))
    .then((imageData) => {
      images = imageData.map((pathImage) => `${dirName}/${pathImage}`);
    })
    .then(() => {
      const htmlUpdate = updateHTML(html, images);
      html = prettier.format(htmlUpdate, { parser: 'html' });
      return fs.writeFile(path.resolve(outputDir, fileName), html);
    });
};

const downloadImages = (links, url) => {
  const promises = links.map((link) => {
    if (link.startsWith('https:')) {
      const config = axios({
        method: 'get',
        url: `${link}`,
        responseType: 'stream',
      });
      return config;
    } else {
      const config = axios({
        method: 'get',
        url: `${url}${link}`,
        responseType: 'stream',
      });
      return config;
    }
  });
  return Promise.all(promises).catch((err) => console.error(err));
};

const updateHTML = (html, data) => {
  const $ = cheerio.load(html);
  $('html')
    .find('img')
    .map(function (index) {
      return $(this).attr('src', data[index]);
    });
  return $.html();
};

export default pageData;
