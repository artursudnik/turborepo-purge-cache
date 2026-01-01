import fs from 'node:fs';

export async function folderExistsAndIsReadable(
  targetPath: string,
): Promise<boolean> {
  try {
    await fs.promises.access(targetPath, fs.constants.R_OK);
    const stats = await fs.promises.stat(targetPath);
    return stats.isDirectory();
  } catch (error) {
    console.error(error);
    return false;
  }
}
