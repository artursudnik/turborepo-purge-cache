import fs from 'node:fs';
import path from 'node:path';
import { getOldCacheEntriesHashes } from './get-old-cache-entries-hashes.function';
import { getRunTasksHashes } from './get-run-tasks-hashes.function';

/**
 * Removes old and unreferenced cache entries from the specified turbo folder. Cache entries are considered
 * unreferenced if they are not associated with any current task runs, and old if they exceed the time-to-live (TTL) period in days.
 *
 * @param {Object} params - The parameters for the method.
 * @param {string} params.turboFolder - The path to the turbo folder containing the cache and runs directories.
 * @param {number} params.daysTTL - The time-to-live period (in days) used to identify old cache entries.
 * @return {Promise<void>} A promise that resolves when the removal process is completed.
 */
export async function removeOldUnreferencedCacheEntries({
  turboFolder,
  daysTTL,
}: {
  turboFolder: string;
  daysTTL: number;
}): Promise<void> {
  const runsPath = path.join(turboFolder, 'runs');
  const cacheFolder = path.join(turboFolder, 'cache');

  const runsFilenamesLeft = await fs.promises.readdir(runsPath);

  const taskHashesReferenced = new Set<string>();

  for (const runFilename of runsFilenamesLeft) {
    const hashes = await getRunTasksHashes({
      runFilePath: path.join(runsPath, runFilename),
    });
    hashes.forEach((hash) => taskHashesReferenced.add(hash));
  }

  const oldCacheEntriesHashes = await getOldCacheEntriesHashes({
    cacheFolder,
    daysTTL,
  });

  console.log(`Found ${oldCacheEntriesHashes.length} old cache entries.`);

  const cacheEntriesHashesToBeRemoved: string[] = oldCacheEntriesHashes.filter(
    (hash) => !taskHashesReferenced.has(hash),
  );

  console.log(
    `Found ${cacheEntriesHashesToBeRemoved.length} unreferenced cache entries`,
  );

  if (cacheEntriesHashesToBeRemoved.length > 0) {
    console.log(
      `Removing ${cacheEntriesHashesToBeRemoved.length} unreferenced cache entries.`,
    );

    const filesToBeRemoved: string[] = [
      ...cacheEntriesHashesToBeRemoved.map((hash) => `${hash}.tar.zst`),
      ...cacheEntriesHashesToBeRemoved.map((hash) => `${hash}-meta.json`),
    ];

    console.log(`Removing ${filesToBeRemoved.length} files.`);

    await Promise.all(
      filesToBeRemoved.map((file) =>
        fs.promises.rm(path.join(cacheFolder, file)),
      ),
    );
  }
}
