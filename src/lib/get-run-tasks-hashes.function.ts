import fs from 'node:fs';

export async function getRunTasksHashes({
  runFilePath,
}: {
  runFilePath: string;
}): Promise<string[]> {
  const fileContent = await fs.promises.readFile(runFilePath, 'utf8');
  const contentParsed = JSON.parse(fileContent);
  return contentParsed.tasks.map((task: { hash: string }) => task.hash);
}
