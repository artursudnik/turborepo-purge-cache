import fs from 'node:fs';
import path from 'node:path';

/**
 * Removes old runs from a specified folder based on a time-to-live (TTL) value in days.
 *
 * @param {Object} params - An object containing the method parameters.
 * @param {string} params.runsFolder - The path to the folder containing run files to check and remove.
 * @param {number} params.daysTTL - The number of days to use as the time-to-live threshold for determining old runs.
 * @return {Promise<void>} A promise that resolves when the old run files have been removed, or if no files need to be removed.
 */
export async function removeOldRuns({
  runsFolder,
  daysTTL,
}: {
  runsFolder: string;
  daysTTL: number;
}): Promise<void> {
  const timeLimit = new Date();
  timeLimit.setDate(timeLimit.getDate() - daysTTL);

  const runFilenames: string[] = await fs.promises.readdir(runsFolder);

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
      `Removing ${runsFilesToBeRemoved.length} runs older than ${daysTTL} days.`,
    );

    await Promise.all(
      runsFilesToBeRemoved.map((run) =>
        fs.promises.rm(path.join(runsFolder, run)),
      ),
    );
  } else {
    console.log(`No runs older than ${daysTTL} days found.`);
  }
}
