import fs from 'node:fs';

/**
 * Checks if a folder exists at the given path and is readable.
 *
 * @param {string} targetPath - The path to the folder to be checked.
 * @return {Promise<boolean>} A promise that resolves to `true` if the folder exists and is readable, otherwise `false`.
 */
export async function folderExistsAndIsReadable(
  targetPath: string,
): Promise<boolean> {
  try {
    await fs.promises.access(targetPath, fs.constants.R_OK);
    const stats = await fs.promises.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
