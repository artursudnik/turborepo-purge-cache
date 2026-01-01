import fs from 'node:fs';
import path from 'node:path';

export async function getOldCacheEntriesHashes({
  cacheFolder,
  daysTTL,
}: {
  cacheFolder: string;
  daysTTL: number;
}): Promise<string[]> {
  const timeLimit = new Date();
  timeLimit.setDate(timeLimit.getDate() - daysTTL);

  const cacheFiles = await fs.promises.readdir(cacheFolder);
  const oldCacheEntries = cacheFiles.filter(
    (file) => fs.statSync(path.join(cacheFolder, file)).birthtime < timeLimit,
  );

  const oldCacheEntriesHashes: string[] = oldCacheEntries
    .map((entry) => {
      return entry.split('.')[0];
    })
    .filter((hash) => !hash.includes('-meta'));

  return oldCacheEntriesHashes;
}
