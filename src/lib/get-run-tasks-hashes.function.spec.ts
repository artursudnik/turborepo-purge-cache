import fs from 'node:fs';
import { getRunTasksHashes } from './get-run-tasks-hashes.function';

jest.mock('node:fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('getRunTasksHashes', () => {
  const runFilePath = 'path/to/run.json';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an array of task hashes when the file is valid', async () => {
    const mockContent = JSON.stringify({
      tasks: [{ hash: 'hash1', other: 'data' }, { hash: 'hash2' }],
    });
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

    const result = await getRunTasksHashes({ runFilePath });

    expect(result).toEqual(['hash1', 'hash2']);
    expect(fs.promises.readFile).toHaveBeenCalledWith(runFilePath, 'utf8');
  });

  it('should throw an error when the file content is not valid JSON', async () => {
    (fs.promises.readFile as jest.Mock).mockResolvedValue('invalid json');

    await expect(getRunTasksHashes({ runFilePath })).rejects.toThrow();
  });

  it('should throw an error when the run file format is invalid (missing tasks)', async () => {
    const mockContent = JSON.stringify({
      notTasks: [],
    });
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

    await expect(getRunTasksHashes({ runFilePath })).rejects.toThrow(
      /Invalid run file format/,
    );
  });

  it('should throw an error when tasks is not an array', async () => {
    const mockContent = JSON.stringify({
      tasks: 'not an array',
    });
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

    await expect(getRunTasksHashes({ runFilePath })).rejects.toThrow(
      /Invalid run file format/,
    );
  });

  it('should throw an error when a task is missing a hash', async () => {
    const mockContent = JSON.stringify({
      tasks: [{ notHash: 'something' }],
    });
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

    await expect(getRunTasksHashes({ runFilePath })).rejects.toThrow(
      /Invalid run file format/,
    );
  });

  it('should propagate errors from fs.promises.readFile', async () => {
    const error = new Error('File not found');
    (fs.promises.readFile as jest.Mock).mockRejectedValue(error);

    await expect(getRunTasksHashes({ runFilePath })).rejects.toThrow(
      'File not found',
    );
  });
});
