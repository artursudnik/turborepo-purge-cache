import fs from 'node:fs';
import path from 'node:path';

const turboFolder = path.join(__dirname, '..', '.turbo');
const runsFolder = path.join(turboFolder, 'runs');
const cacheFolder = path.join(turboFolder, 'cache');

(async (): Promise<void> => {
  if (!(await folderExistsAndIsReadable(turboFolder))) {
    console.error('.turbo folder does not exist or is not readable');
    process.exit(1);
  }

  await removeOldRuns(2);

  const runsLeft = await fs.promises.readdir(runsFolder);

  const taskHashesReferenced = new Set<string>();

  for (const run of runsLeft) {
    const hashes = await getRunTasksHashes(path.join(runsFolder, run));
    hashes.forEach((hash) => taskHashesReferenced.add(hash));
  }

  const oldCacheEntriesHashes = await getOldCacheEntriesHashes(7);

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
})();

async function getOldCacheEntriesHashes(daysAgo: number): Promise<string[]> {
  const timeLimit = new Date();
  timeLimit.setDate(timeLimit.getDate() - daysAgo);

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

async function getRunTasksHashes(runPath: string): Promise<string[]> {
  const fileContent = await fs.promises.readFile(path.join(runPath), 'utf8');
  const contentParsed = JSON.parse(fileContent);
  return contentParsed.tasks.map((task: { hash: string }) => task.hash);
}

async function removeOldRuns(daysAgo: number): Promise<void> {
  const timeLimit = new Date();
  timeLimit.setDate(timeLimit.getDate() - daysAgo);

  const runFilenames: string[] = await fs.promises.readdir(
    path.join(turboFolder, 'runs'),
  );

  console.log(`Found ${runFilenames.length} runs.`);

  const runsFilesWithExecutionTimes: {
    filename: string;
    executionTime: Date;
  }[] = (
    await Promise.all(
      runFilenames.map(async (runFilename) => {
        const content = JSON.parse(
          await fs.promises.readFile(
            path.join(runsFolder, runFilename),
            'utf8',
          ),
        );
        const executionTime = content.execution.startTime;

        if (executionTime) {
          return {
            filename: runFilename,
            executionTime: new Date(executionTime),
          };
        } else {
          return null;
        }
      }),
    )
  ).filter((run) => run !== null);

  const runsFilesToBeRemoved: string[] = runsFilesWithExecutionTimes
    .filter((run) => run.executionTime < timeLimit)
    .map((run) => run.filename);

  if (runsFilesToBeRemoved.length > 0) {
    console.log(
      `Removing ${runsFilesToBeRemoved.length} runs older than ${daysAgo} days.`,
    );

    await Promise.all(
      runsFilesToBeRemoved.map((run) =>
        fs.promises.rm(path.join(turboFolder, 'runs', run)),
      ),
    );
  } else {
    console.log(`No runs older than ${daysAgo} days found.`);
  }
}

async function folderExistsAndIsReadable(path: string): Promise<boolean> {
  try {
    const stats = await fs.promises.stat(path);
    return stats.isDirectory();
  } catch (error) {
    console.error(error);
    return false;
  }
}
