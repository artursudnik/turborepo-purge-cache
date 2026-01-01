import fs from 'node:fs';

/**
 * Retrieves an array of task hashes from the specified run file.
 *
 * @param {Object} params - The parameter object.
 * @param {string} params.runFilePath - The file path of the run file containing task data.
 * @return {Promise<string[]>} A promise that resolves to an array of task hashes.
 */
export async function getRunTasksHashes({
  runFilePath,
}: {
  runFilePath: string;
}): Promise<string[]> {
  const fileContent = await fs.promises.readFile(runFilePath, 'utf8');
  const contentParsed = JSON.parse(fileContent);
  return contentParsed.tasks.map((task: { hash: string }) => task.hash);
}
