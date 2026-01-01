import path from 'node:path';
import {
  folderExistsAndIsReadable,
  removeOldRuns,
  removeOldUnreferencedCacheEntries,
} from './lib';

const turboFolder = path.join(__dirname, '..', '.turbo');
const runsFolder = path.join(turboFolder, 'runs');

(async (): Promise<void> => {
  if (!(await folderExistsAndIsReadable(turboFolder))) {
    console.error('.turbo folder does not exist or is not readable');
    process.exit(1);
  }

  await removeOldRuns({ runsFolder, daysTTL: 1 });
  await removeOldUnreferencedCacheEntries({ turboFolder, daysTTL: 1 });
})();
