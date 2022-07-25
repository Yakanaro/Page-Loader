#!/usr/bin/env node

import { Command } from 'commander';
import pageLoader from '../src/pageload.js';

const program = new Command();

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
