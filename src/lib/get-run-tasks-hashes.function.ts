import fs from 'node:fs';
import z from 'zod';

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

  const schema = z.object({
    tasks: z.array(z.object({ hash: z.string() })),
  });

  const validationResult = schema.safeParse(contentParsed);

  if (!validationResult.success) {
    throw new Error(
      `Invalid run file format: ${runFilePath}. ${JSON.stringify(z.flattenError(validationResult.error).fieldErrors)}`,
    );
  }

  return validationResult.data.tasks.map((task) => task.hash);
}
