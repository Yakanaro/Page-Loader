#!/usr/bin/env node

import { Command } from 'commander';
import pageLoader from '../src/pageload.js';

const program = new Command();

program
  .version('1.0.0')
  .arguments('<url>')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .action((url, options) => {
    const outputPath = options.output;
    pageLoader(url, outputPath)
      .then(() => console.log('files have been created successfully'))
      .catch((err) => {
        console.error(err.message);
        process.exit(1);
      });
  });
program.parse(process.argv);

// program
//   .version('1.0.0')
//   .description('Load page.')
//   .option('-o, --output <pathToFolder>', 'folder', process.cwd())
//   .arguments('<address>')
//   .action((address) =>
//     pageData(program.output, address)
//       .then(() => console.log('files have been created successfully'))
//       .catch((error) => {
//         console.error(error.message);
//         process.exit(1);
//       })
//   )
//   .parse(process.argv);
