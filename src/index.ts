#!/usr/bin/env node
import path from 'node:path';
import { parseArguments } from './commander';
import {
  folderExistsAndIsReadable,
  removeOldRuns,
  removeOldUnreferencedCacheEntries,
} from './lib';

const { path: pathArg, options } = parseArguments();

const turboFolder = pathArg ?? path.join(process.cwd(), '.turbo');
const runsFolder = path.join(turboFolder, 'runs');

(async (): Promise<void> => {
  console.log('starting cleanup...');

  console.log(`checking ${turboFolder} folder`);

  if (!(await folderExistsAndIsReadable(turboFolder))) {
    console.error(`${turboFolder} folder does not exist or is not readable`);
    process.exit(1);
  }

  await removeOldRuns({ runsFolder, daysTTL: options.runsTtl });

  await removeOldUnreferencedCacheEntries({
    turboFolder,
    daysTTL: options.cacheTtl,
  });
})();
