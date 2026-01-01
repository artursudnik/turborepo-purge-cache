import fs from 'node:fs';
import path from 'node:path';
import { getOldCacheEntriesHashes } from './get-old-cache-entries-hashes.function';
import { getRunTasksHashes } from './get-run-tasks-hashes.function';

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
