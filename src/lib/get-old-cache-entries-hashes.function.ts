import fs from 'node:fs';
import path from 'node:path';

/**
 * Retrieves the hashes of old cache entries based on the defined time-to-live (TTL).
 *
 * @param {Object} params - An object containing the parameters.
 * @param {string} params.cacheFolder - The path to the cache folder where cache files are stored.
 * @param {number} params.daysTTL - The number of days defining the time-to-live for cache entries.
 * @return {Promise<string[]>} A promise that resolves to an array of hashes of old cache entries.
 */
export async function getOldCacheEntriesHashes({
  cacheFolder,
  daysTTL,
}: {
  cacheFolder: string;
  daysTTL: number;
}): Promise<string[]> {
  const timeLimit = new Date();
  timeLimit.setDate(timeLimit.getDate() - daysTTL);

  const cacheMetaFiles = (await fs.promises.readdir(cacheFolder)).filter(
    (file) => file.endsWith('-meta.json'),
  );

  const cacheMetaFilesWithStats = await Promise.all(
    cacheMetaFiles.map(async (file) => {
      const stats = await fs.promises.stat(path.join(cacheFolder, file));
      return { file, stats };
    }),
  );

  const oldCacheMetaFiles = cacheMetaFilesWithStats
    .filter(({ stats }) => stats.mtime < timeLimit)
    .map(({ file }) => file);

  const oldCacheEntriesHashes: string[] = oldCacheMetaFiles.map((entry) =>
    entry.replace(/-meta\.json$/, ''),
  );

  return oldCacheEntriesHashes;
}
