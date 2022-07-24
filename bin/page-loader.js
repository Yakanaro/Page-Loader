#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/pageload.js';
import process from 'process';
// program
//   .version('0.1.0')
//   .arguments('<url>')
//   .description('web pages downloader')
//   .option('-o, --output [type]', 'destination', process.cwd())
//   .action((url, options) => {
//     pageLoader(url, options.output).catch((err) => {
//       console.error(err.message);
//       process.exit(1);
//     });
//   });
// program.parse(process.argv);

program
  .version('0.1.0')
  .arguments('<url>')
  .description('web pages downloader')
  .option('-o, --output [type]', 'destination', process.cwd())
  .action((url, option) => {
    pageLoader(url, option.output).catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
  });
program.parse(process.argv);
